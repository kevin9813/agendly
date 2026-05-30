import json
from datetime import datetime
from functools import wraps
from django.utils import timezone
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Prefetch
from django.db.models import Q

from .models import Barrio, Cobertura, Cita, Cliente, Negocio, Rol, Servicio, Sucursal, User, UserServicio, Ciudad, NegocioSuscripcion, Plan, SucursalHorario


def parse_datetime(value):
    if isinstance(value, str):
        return datetime.fromisoformat(value.replace('Z', '+00:00'))
    return value


def serialize_datetime(value):
    if isinstance(value, str):
        return value
    return value.isoformat() if value else None


def require_auth(view_func):
    """Decorador para requerir autenticación. Extrae user_id y user_rol de la sesión."""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        user_id = request.session.get('user_id')
        user_rol = request.session.get('user_rol')
        
        if not user_id or not user_rol:
            return JsonResponse({'detail': 'No autenticado'}, status=401)
        
        # Pasar el user_id y user_rol al view
        request.user_id = user_id
        request.user_rol = user_rol
        return view_func(request, *args, **kwargs)
    
    return wrapper


@csrf_exempt
def api_root(request):
    return JsonResponse({'message': 'Hola desde Django'})


@csrf_exempt
def login_view(request):
    if request.method != 'POST':
        return JsonResponse({'detail': 'Use POST'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except json.JSONDecodeError:
        return JsonResponse({'detail': 'JSON inválido'}, status=400)

    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return JsonResponse({'detail': 'Usuario y contraseña son requeridos'}, status=400)

    user = User.objects.select_related('rol', 'negocio').filter(username=username).first()
    if user is None or not user.check_password(password):
        return JsonResponse({'success': False, 'detail': 'Credenciales inválidas'}, status=401)

    # Guardar información en sesión
    request.session['user_id'] = user.id
    request.session['user_rol'] = user.rol.name
    request.session['negocio_id'] = user.negocio.id

    return JsonResponse(
        {
            'success': True,
            'user': {
                'id': user.id,
                'name': user.name,
                'username': user.username,
                'rol': user.rol.name,
                'negocio': user.negocio.name,
                'negocio_id': user.negocio.id,
            },
        }
    )


@csrf_exempt
def logout_view(request):
    """Logout endpoint"""
    if request.method != 'POST':
        return JsonResponse({'detail': 'Use POST'}, status=405)
    
    request.session.flush()
    return JsonResponse({'message': 'Sesión cerrada'})


@csrf_exempt
def me_view(request):
    """Obtener datos del usuario autenticado"""
    if request.method != 'GET':
        return JsonResponse({'detail': 'Use GET'}, status=405)
    
    user_id = request.session.get('user_id')
    
    if not user_id:
        return JsonResponse({'detail': 'No autenticado'}, status=401)
    
    user = User.objects.select_related('rol', 'negocio').get(id=user_id)
    
    return JsonResponse({
        'id': user.id,
        'name': user.name,
        'username': user.username,
        'rol': user.rol.name,
        'negocio': user.negocio.name,
        'negocio_id': user.negocio.id,
    })


# Dashboard data
@csrf_exempt
def dashboard_view(request):
    if request.method != 'GET':
        return JsonResponse({'detail': 'Use GET'}, status=405)

    user_id = request.session.get('user_id')
    user_rol = request.session.get('user_rol')

    if not user_id or not user_rol:
        return JsonResponse({'detail': 'No autenticado'}, status=401)

    # Get some basic stats
    total_users = User.objects.count()
    total_clientes = Cliente.objects.count()
    citas_pendientes = Cita.objects.filter(estado='pendiente').select_related('cliente', 'servicio').all()

    # Filtrar según el rol
    total_citas = 0
    if user_rol == 'Empleado':
        # Los empleados solo ven sus propias citas
        total_citas = Cita.objects.filter(empleado_id=user_id).count()
    elif user_rol == 'Administrador':
        total_citas = Cita.objects.count()

    citas_pendientes_data = [{
        'id': c.id,
        'cliente': c.cliente.name if c.cliente else 'Sin cliente',
        'servicio': c.servicio.name if c.servicio else 'Sin servicio',
        'fecha_hora': serialize_datetime(c.fecha_hora),
        'estado': c.estado,
        'tipo_reserva': c.tipo_reserva,
        'rango_inicio': serialize_datetime(c.rango_inicio),
        'rango_fin': serialize_datetime(c.rango_fin),
    } for c in citas_pendientes]

    return JsonResponse({
        'stats': {
            'total_users': total_users,
            'total_clientes': total_clientes,
            'total_citas': total_citas,
            'citas_pendientes': citas_pendientes_data,
        }
    })


# CRUD for Negocio
@csrf_exempt
def negocio_list(request):
    if request.method == 'GET':
        negocios = Negocio.objects.all()
        data = [{
            'id': n.id,
            'name': n.name,
        } for n in negocios]
        return JsonResponse({'negocios': data})

    elif request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            negocio = Negocio.objects.create(
                name=data['name'],
            )
            return JsonResponse({'id': negocio.id, 'message': 'Negocio creado'})
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=400)

    return JsonResponse({'detail': 'Method not allowed'}, status=405)


@csrf_exempt
def negocio_detail(request, negocio_id):
    try:
        negocio = Negocio.objects.get(id=negocio_id)
    except Negocio.DoesNotExist:
        return JsonResponse({'detail': 'Negocio no encontrado'}, status=404)

    if request.method == 'GET':
        data = {
            'id': negocio.id,
            'name': negocio.name
        }
        return JsonResponse(data)

    elif request.method in ['PUT', 'PATCH']:
        try:
            data = json.loads(request.body.decode('utf-8'))
            negocio.name = data.get('name', negocio.name)
            negocio.save()
            return JsonResponse({'message': 'Negocio actualizado'})
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=400)

    elif request.method == 'DELETE':
        negocio.delete()
        return JsonResponse({'message': 'Negocio eliminado'})

    return JsonResponse({'detail': 'Method not allowed'}, status=405)

@csrf_exempt
def negocios_list_sucursales(request):
    if request.method == 'GET':
        negocios = Negocio.objects.prefetch_related(Prefetch('sucursales',
            queryset=Sucursal.objects.filter(activo=True))).all()

        data = []
        for n in negocios:
            sucursales_data = []

            for s in n.sucursales.all():
                sucursales_data.append({
                    'id': s.id,
                    'name': s.name,
                    'direccion': s.direccion,
                    'tel': s.tel,
                    'whatsapp': s.whatsapp,
                    'ciudad': s.ciudad.name if s.ciudad else '',
                    'barrio': s.barrio.name if s.barrio else '',
                    'horario': s.horario,
                    'permite_agendar': s.permite_agendar,
                    'lazos_tiempo': s.lazos_tiempo,
                    'activo': s.activo,
                })

            data.append({
                'id': n.id,
                'name': n.name,
                'sucursales': sucursales_data
            })

        return JsonResponse({'negocios': data})

    return JsonResponse({'detail': 'Method not allowed'}, status=405)

@csrf_exempt
def negocio_detail_sucursales(request, negocio_id):
    try:
        negocio = Negocio.objects.prefetch_related('sucursales__horarios').get(id=negocio_id)
    except Negocio.DoesNotExist:
        return JsonResponse({'detail': 'Negocio no encontrado'}, status=404)

    if request.method == 'GET':
        sucursales_data = []
        horarios_data = []
        for s in negocio.sucursales.all():
            
            for h in s.horarios.all():
                horarios_data.append({
                    'dia_semana': h.dia_semana,
                    'nombre': h.get_dia_semana_display(),
                    'hora_inicio': h.hora_inicio.strftime('%H:%M') if h.hora_inicio else '',
                    'hora_fin': h.hora_fin.strftime('%H:%M') if h.hora_fin else '',
                    'activo': h.activo,
                })

            sucursales_data.append({
                'id': s.id,
                'name': s.name,
                'direccion': s.direccion,
                'tel': s.tel,
                'whatsapp': s.whatsapp,
                'ciudad': s.ciudad.name if s.ciudad else '',
                'barrio': s.barrio.name if s.barrio else '',
                'horario': s.horario,
                'permite_agendar': s.permite_agendar,
                'lazos_tiempo': s.lazos_tiempo,
                'activo': s.activo,
                'horarios': horarios_data,
            })

        data = {
            'id': negocio.id,
            'name': negocio.name,
            'sucursales': sucursales_data
        }
        return JsonResponse(data)

    return JsonResponse({'detail': 'Method not allowed'}, status=405)

@csrf_exempt
def sucursales_list(request):
    if request.method == 'GET':
        negocio_id = request.GET.get('negocio_id')
        sucursales = Sucursal.objects.select_related('ciudad', 'barrio', 'negocio').all()
        if negocio_id:
            sucursales = sucursales.filter(negocio_id=negocio_id)
        data = [{
            'id': s.id,
            'negocio_id': s.negocio_id,
            'name': s.name,
            'direccion': s.direccion,
            'tel': s.tel,
            'whatsapp': s.whatsapp,
            'ciudad': s.ciudad.name,
            'ciudad_id': s.ciudad_id,
            'barrio': s.barrio.name,
            'barrio_id': s.barrio_id,
            'horario': s.horario,
            'permite_agendar': s.permite_agendar,
            'lazos_tiempo': s.lazos_tiempo,
            'activo': s.activo,
        } for s in sucursales]
        return JsonResponse({'sucursales': data})

    elif request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            sucursal = Sucursal.objects.create(
                negocio_id=data['negocio_id'],
                name=data['name'],
                direccion=data.get('direccion', ''),
                tel=data.get('tel', ''),
                whatsapp=data.get('whatsapp', ''),
                ciudad_id=data['ciudad_id'],
                barrio_id=data['barrio_id'],
                horario=data.get('horario', ''),
                permite_agendar=data.get('permite_agendar', False),
                lazos_tiempo=data.get('lazos_tiempo', False),
                activo=data.get('activo', True),
            )
            return JsonResponse({'id': sucursal.id, 'message': 'Sucursal creada'})
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=400)

    return JsonResponse({'detail': 'Method not allowed'}, status=405)


@csrf_exempt
def sucursal_detail(request, sucursal_id):
    try:
        sucursal = Sucursal.objects.select_related('ciudad', 'barrio', 'negocio').get(id=sucursal_id)
    except Sucursal.DoesNotExist:
        return JsonResponse({'detail': 'Sucursal no encontrada'}, status=404)

    if request.method == 'GET':
        data = {
            'id': sucursal.id,
            'negocio_id': sucursal.negocio_id,
            'name': sucursal.name,
            'direccion': sucursal.direccion,
            'tel': sucursal.tel,
            'whatsapp': sucursal.whatsapp,
            'ciudad': sucursal.ciudad.name,
            'ciudad_id': sucursal.ciudad_id,
            'barrio': sucursal.barrio.name,
            'barrio_id': sucursal.barrio_id,
            'horario': sucursal.horario,
            'permite_agendar': sucursal.permite_agendar,
            'lazos_tiempo': sucursal.lazos_tiempo,
            'activo': sucursal.activo,
        }
        return JsonResponse(data)

    elif request.method in ['PUT', 'PATCH']:
        try:
            data = json.loads(request.body.decode('utf-8'))
            sucursal.name = data.get('name', sucursal.name)
            sucursal.direccion = data.get('direccion', sucursal.direccion)
            sucursal.tel = data.get('tel', sucursal.tel)
            sucursal.whatsapp = data.get('whatsapp', sucursal.whatsapp)
            sucursal.ciudad_id = data.get('ciudad_id', sucursal.ciudad_id)
            sucursal.barrio_id = data.get('barrio_id', sucursal.barrio_id)
            sucursal.horario = data.get('horario', sucursal.horario)
            sucursal.permite_agendar = data.get('permite_agendar', sucursal.permite_agendar)
            sucursal.lazos_tiempo = data.get('lazos_tiempo', sucursal.lazos_tiempo)
            sucursal.activo = data.get('activo', sucursal.activo)
            sucursal.save()
            horarios = data.get('horarios', [])
             # Eliminar horarios anteriores
            SucursalHorario.objects.filter(sucursal=sucursal).delete()
             # Crear nuevos
            for horario in horarios:
                SucursalHorario.objects.create(
                    sucursal=sucursal,
                    dia_semana=horario['dia_semana'],
                    hora_inicio=horario['hora_inicio'],
                    hora_fin=horario['hora_fin'],
                    activo=horario['activo']
                )

            return JsonResponse({'message': 'Sucursal actualizada'})
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=400)

    elif request.method == 'DELETE':
        sucursal.delete()
        return JsonResponse({'message': 'Sucursal eliminada'})

    return JsonResponse({'detail': 'Method not allowed'}, status=405)

@csrf_exempt
def negocio_suscripcion(request, negocio_id):
    if request.method == 'GET':
        suscripcion = NegocioSuscripcion.objects.select_related('plan').filter(negocio_id=negocio_id).order_by('-fecha_fin').first()
        if not suscripcion:
            return JsonResponse({'activa': False, 'plan': 'Basico'})
        
        activa = suscripcion.fecha_fin >= timezone.now().date()

        data = {
            'id': suscripcion.id,
            'negocio_id': suscripcion.negocio_id,
            'plan': suscripcion.plan.name,
            'plan_id': suscripcion.plan_id,
            'fecha_inicio': serialize_datetime(suscripcion.fecha_inicio),
            'fecha_fin': serialize_datetime(suscripcion.fecha_fin),
            'activa': activa,
        }
        return JsonResponse(data)


@csrf_exempt
def sucursal_horarios(request, sucursal_id):
    if request.method == 'GET':
        horarios = SucursalHorario.objects.filter(sucursal_id=sucursal_id)
        # Si existen horarios guardados
        if horarios.exists():

            data = [{
                'id': h.id,
                'dia_semana': h.dia_semana,
                'nombre': h.get_dia_semana_display(),
                'hora_inicio': h.hora_inicio.strftime('%H:%M') if h.hora_inicio else '',
                'hora_fin': h.hora_fin.strftime('%H:%M') if h.hora_fin else '',
                'activo': h.activo,
            } for h in horarios]

        else:
            # Horarios por defecto
            dias = [
                'Domingo',
                'Lunes',
                'Martes',
                'Miércoles',
                'Jueves',
                'Viernes',
                'Sábado',
            ]

            data = []

            for i, nombre in enumerate(dias):

                data.append({
                    'id': None,
                    'dia_semana': i,
                    'nombre': nombre,
                    'hora_inicio': '08:00',
                    'hora_fin': '18:00',
                    'activo': False if i == 0 else True,
                })

        return JsonResponse({
            'horarios': data
        })

# Similar CRUD views for other models would go here
# For brevity, I'll add basic list views for now

@csrf_exempt
def roles_list(request):
    if request.method == 'GET':
        roles = Rol.objects.all()
        data = [{
            'id': r.id,
            'name': r.name,
        } for r in roles]
        return JsonResponse({'roles': data})

    return JsonResponse({'detail': 'Method not allowed'}, status=405)


@csrf_exempt
def barrios_list(request):
    if request.method == 'GET':
        barrios = Barrio.objects.select_related('ciudad').all()
        data = [{
            'id': b.id,
            'name': b.name,
            'ciudad': b.ciudad.name,
            'ciudad_id': b.ciudad_id,
        } for b in barrios]
        return JsonResponse({'barrios': data})
    return JsonResponse({'detail': 'Method not allowed'}, status=405)


@csrf_exempt
def coberturas_list(request):
    if request.method == 'GET':
        negocio_id = request.GET.get('negocio_id')
        coberturas = Cobertura.objects.select_related('barrio', 'negocio').all()
        if negocio_id:
            coberturas = coberturas.filter(negocio_id=negocio_id)
        data = [{
            'id': c.id,
            'negocio_id': c.negocio_id,
            'barrio': c.barrio.name,
            'barrio_id': c.barrio_id,
            'costo_extra': str(c.costo_extra),
            'tiempo_estimado': c.tiempo_estimado,
            'activo': c.activo,
        } for c in coberturas]
        return JsonResponse({'coberturas': data})
    return JsonResponse({'detail': 'Method not allowed'}, status=405)


@csrf_exempt
def usuarios_list(request):
    if request.method == 'GET':
        users = User.objects.select_related('rol', 'negocio', 'sucursal').prefetch_related('user_servicios__servicio').all()
        data = [{
            'id': u.id,
            'name': u.name,
            'username': u.username,
            'rol': u.rol.name,
            'rol_id': u.rol.id,
            'negocio': u.negocio.name,
            'negocio_id': u.negocio.id,
            'sucursal': u.sucursal.name,
            'sucursal_id': u.sucursal_id,
            'color': u.color,
            'whatsapp': u.whatsapp,
            'servicios_ids': [us.servicio_id for us in u.user_servicios.all()],
            'servicios': [us.servicio.name for us in u.user_servicios.all()],
        } for u in users]
        return JsonResponse({'usuarios': data})

    elif request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            user = User.objects.create(
                name=data['name'],
                username=data['username'],
                rol_id=data['rol_id'],
                negocio_id=data['negocio_id'],
                sucursal_id=data.get('sucursal_id'),
                color=data.get('color', '#4ECDC4'),
                whatsapp=data.get('whatsapp', ''),
            )
            user.set_password(data['password'])
            user.save()

            servicios_ids = data.get('servicios_ids', [])
            UserServicio.objects.bulk_create([
                UserServicio(user=user, servicio_id=servicio_id)
                for servicio_id in servicios_ids
            ])

            return JsonResponse({
                'id': user.id,
                'message': 'Usuario creado',
                'usuario': {
                    'id': user.id,
                    'name': user.name,
                    'username': user.username,
                    'rol': user.rol.name,
                    'negocio': user.negocio.name,
                    'color': user.color,
                    'whatsapp': user.whatsapp,
                    'servicios_ids': servicios_ids,
                    'sucursal_id': user.sucursal_id,
                }
            })
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=400)

    return JsonResponse({'detail': 'Method not allowed'}, status=405)


@csrf_exempt
def usuario_detail(request, usuario_id):
    try:
        user = User.objects.select_related('rol', 'negocio').get(id=usuario_id)
    except User.DoesNotExist:
        return JsonResponse({'detail': 'Usuario no encontrado'}, status=404)

    servicios_ids = list(user.user_servicios.values_list('servicio_id', flat=True))

    if request.method == 'GET':
        data = {
            'id': user.id,
            'name': user.name,
            'username': user.username,
            'rol': user.rol.name,
            'rol_id': user.rol.id,
            'negocio': user.negocio.name,
            'negocio_id': user.negocio.id,
            'color': user.color,
            'whatsapp': user.whatsapp,
            'servicios_ids': servicios_ids,
            'sucursal_id': user.sucursal_id,
        }
        return JsonResponse(data)

    elif request.method in ['PUT', 'PATCH']:
        try:
            data = json.loads(request.body.decode('utf-8'))
            user.name = data.get('name', user.name)
            user.username = data.get('username', user.username)
            user.rol_id = data.get('rol_id', user.rol_id)
            user.negocio_id = data.get('negocio_id', user.negocio_id)
            user.sucursal_id = data.get('sucursal_id', user.sucursal_id)
            user.color = data.get('color', user.color)
            user.whatsapp = data.get('whatsapp', user.whatsapp)
            if 'password' in data and data['password']:
                user.set_password(data['password'])
            user.save()

            if 'servicios_ids' in data:
                servicios_ids = data.get('servicios_ids', []) or []
                UserServicio.objects.filter(user=user).exclude(servicio_id__in=servicios_ids).delete()
                existing_ids = set(user.user_servicios.values_list('servicio_id', flat=True))
                UserServicio.objects.bulk_create([
                    UserServicio(user=user, servicio_id=sid)
                    for sid in servicios_ids
                    if sid not in existing_ids
                ])

            return JsonResponse({
                'message': 'Usuario actualizado',
                'usuario': {
                    'id': user.id,
                    'name': user.name,
                    'username': user.username,
                    'rol': user.rol.name,
                    'negocio': user.negocio.name,
                    'color': user.color,
                    'whatsapp': user.whatsapp,
                    'servicios_ids': servicios_ids,
                    'sucursal_id': user.sucursal_id,
                }
            })
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=400)

    elif request.method == 'DELETE':
        user.delete()
        return JsonResponse({'message': 'Usuario eliminado'})

    return JsonResponse({'detail': 'Method not allowed'}, status=405)


@csrf_exempt
def servicios_list(request):
    if request.method == 'GET':
        servicios = Servicio.objects.select_related('negocio').all()
        data = [{
            'id': s.id,
            'name': s.name,
            'precio': str(s.precio),
            'tiempo': s.tiempo,
            'permite_domicilio': s.permite_domicilio,
            'notas': s.notas,
            'negocio': s.negocio.name,
            'negocio_id': s.negocio.id,
        } for s in servicios]
        return JsonResponse({'servicios': data})

    elif request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            servicio = Servicio.objects.create(
                name=data['name'],
                precio=data['precio'],
                tiempo=data['tiempo'],
                permite_domicilio=data.get('permite_domicilio', False),
                notas=data.get('notas', ''),
                negocio_id=data['negocio_id'],
            )
            return JsonResponse({
                'id': servicio.id,
                'message': 'Servicio creado',
                'servicio': {
                    'id': servicio.id,
                    'nombre': servicio.name,
                    'precio': str(servicio.precio),
                    'tiempo': servicio.tiempo,
                    'permite_domicilio': servicio.permite_domicilio,
                    'notas': servicio.notas,
                    'negocio': servicio.negocio.name,
                }
            })
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=400)

    return JsonResponse({'detail': 'Method not allowed'}, status=405)


@csrf_exempt
def servicio_detail(request, servicio_id):
    try:
        servicio = Servicio.objects.get(id=servicio_id)
    except Servicio.DoesNotExist:
        return JsonResponse({'detail': 'Servicio no encontrado'}, status=404)

    if request.method == 'GET':
        data = {
            'id': servicio.id,
            'nombre': servicio.name,
            'precio': str(servicio.precio),
            'tiempo': servicio.tiempo,
            'permite_domicilio': servicio.permite_domicilio,
            'notas': servicio.notas,
            'negocio': servicio.negocio.name,
            'negocio_id': servicio.negocio.id,
        }
        return JsonResponse(data)

    elif request.method in ['PUT', 'PATCH']:
        try:
            data = json.loads(request.body.decode('utf-8'))
            servicio.name = data.get('nombre', servicio.name)
            servicio.precio = data.get('precio', servicio.precio)
            servicio.tiempo = data.get('tiempo', servicio.tiempo)
            servicio.permite_domicilio = data.get('permite_domicilio', servicio.permite_domicilio)
            servicio.notas = data.get('notas', servicio.notas)
            servicio.negocio_id = data.get('negocio_id', servicio.negocio_id)
            servicio.save()
            return JsonResponse({
                'message': 'Servicio actualizado',
                'servicio': {
                    'id': servicio.id,
                    'nombre': servicio.name,
                    'precio': str(servicio.precio),
                    'tiempo': servicio.tiempo,
                    'permite_domicilio': servicio.permite_domicilio,
                    'notas': servicio.notas,
                    'negocio': servicio.negocio.name,
                }
            })
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=400)

    elif request.method == 'DELETE':
        servicio.delete()
        return JsonResponse({'message': 'Servicio eliminado'})

    return JsonResponse({'detail': 'Method not allowed'}, status=405)


@csrf_exempt
def negocio_servicios_list(request, negocio_id):
    if request.method == 'GET':
        servicios = Servicio.objects.filter(negocio_id=negocio_id)
        data = [{
            'id': s.id,
            'nombre': s.name,
            'precio': str(s.precio),
            'tiempo': s.tiempo,
            'notas': s.notas,
            'permite_domicilio': s.permite_domicilio,
            'negocio': s.negocio.name,
        } for s in servicios]
        return JsonResponse({'servicios': data})

@csrf_exempt
def clientes_list(request):
    if request.method == 'GET':
        clientes = Cliente.objects.all()
        
        # Filtrar por parámetros de query
        celular = request.GET.get('celular')
        negocio_id = request.GET.get('negocio_id')
        
        if celular:
            clientes = clientes.filter(celular=celular)
        if negocio_id:
            clientes = clientes.filter(negocio_id=negocio_id)
        
        data = [{'id': c.id, 'name': c.name, 'celular': c.celular, 'negocio_id': c.negocio_id} for c in clientes]
        return JsonResponse({'clientes': data})
    elif request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            cliente = Cliente.objects.create(
                name=data['name'],
                celular=data.get('celular', ''),
                negocio_id=data['negocio_id']
            )
            return JsonResponse({
                'id': cliente.id,
                'message': 'Cliente creado',
                'cliente': {'id': cliente.id, 'name': cliente.name, 'celular': cliente.celular, 'negocio_id': cliente.negocio_id}
            })
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=400)
    return JsonResponse({'detail': 'Method not allowed'}, status=405)


@csrf_exempt
def cliente_detail(request, cliente_id):
    try:
        cliente = Cliente.objects.get(id=cliente_id)
    except Cliente.DoesNotExist:
        return JsonResponse({'detail': 'Cliente no encontrado'}, status=404)

    if request.method == 'GET':
        data = {
            'id': cliente.id,
            'name': cliente.name,
            'celular': cliente.celular,
            'negocio_id': cliente.negocio.id,

        }
        return JsonResponse(data)

    elif request.method in ['PUT', 'PATCH']:
        try:
            data = json.loads(request.body.decode('utf-8'))
            cliente.name = data.get('name', cliente.name)
            cliente.celular = data.get('celular', cliente.celular)
            cliente.negocio_id = data.get('negocio_id', cliente.negocio_id)
            cliente.save()
            return JsonResponse({
                'message': 'Cliente actualizado',
                'cliente': {
                    'id': cliente.id,
                    'name': cliente.name,
                    'celular': cliente.celular,
                    'negocio_id': cliente.negocio_id,
                }
            })
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=400)

    elif request.method == 'DELETE':
        cliente.delete()
        return JsonResponse({'message': 'Cliente eliminado'})

    return JsonResponse({'detail': 'Method not allowed'}, status=405)


@csrf_exempt
def citas_list(request):
    if request.method == 'GET':
        # GET requiere autenticación
        user_id = request.session.get('user_id')
        user_rol = request.session.get('user_rol')
        
        if not user_id or not user_rol:
            return JsonResponse({'detail': 'No autenticado'}, status=401)
        
        # Permitir filtrar por mes y año
        mes = request.GET.get('mes')
        ano = request.GET.get('ano')
        negocio_id = request.GET.get('negocio_id')
        
        citas = Cita.objects.select_related('cliente', 'empleado', 'servicio', 'cobertura').all()
        
        # Filtrar según el rol
        if user_rol == 'Empleado':
            # Los empleados solo ven sus propias citas
            citas = citas.filter(empleado_id=user_id)
        elif user_rol == 'Administrador':
            # Los administradores ven citas de su negocio
            if negocio_id:
                citas = citas.filter(empleado__negocio_id=negocio_id)
            else:
                # Si no especifica negocio_id, usar el del usuario
                negocio_id = request.session.get('negocio_id')
                if negocio_id:
                    citas = citas.filter(empleado__negocio_id=negocio_id)
        
        if mes and ano:
            from django.db.models import Q
            citas = citas.filter(
                fecha_hora__year=int(ano),
                fecha_hora__month=int(mes)
            )
        
        data = [{
            'id': c.id,
            'cliente': c.cliente.name,
            'cliente_id': c.cliente.id,
            'cliente_celular': c.cliente.celular,
            'empleado': c.empleado.name,
            'empleado_id': c.empleado.id,
            'empleado_color': c.empleado.color,
            'servicio': c.servicio.name,
            'servicio_id': c.servicio.id,
            'servicio_tiempo': c.servicio.tiempo,
            'fecha_hora': serialize_datetime(c.fecha_hora),
            'hora_fin': serialize_datetime(c.hora_fin),
            'estado': c.estado,
            'tipo_servicio': c.tipo_servicio,
            'cobertura_id': c.cobertura_id,
            'cobertura': c.cobertura.barrio.name if c.cobertura else None,
            'direccion': c.direccion,
            'notas': c.notas,
            'tipo_reserva': c.tipo_reserva,
            'rango_inicio': serialize_datetime(c.rango_inicio),
            'rango_fin': serialize_datetime(c.rango_fin),
            'precio_final': float(c.precio_final) if c.precio_final else 0,
        } for c in citas]
        return JsonResponse({'citas': data})
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            
            hora_inicio = data.get('hora_inicio')
            hora_fin_rango = data.get('hora_fin_rango')

            es_rango = bool(hora_inicio and hora_fin_rango)

            # Si hay sesión autenticada, validar según el rol
            user_id = request.session.get('user_id')
            user_rol = request.session.get('user_rol')

            # Validar que la fecha_hora no sea anterior a ahora
            from django.utils import timezone
            from datetime import datetime, timedelta
            try:
                fecha_validar = hora_inicio if es_rango else data.get('fecha_hora')
                if fecha_validar:
                    fecha_hora = datetime.fromisoformat(fecha_validar.replace('Z', '+00:00'))
                    fecha_hora_aware = timezone.make_aware(fecha_hora) if timezone.is_naive(fecha_hora) else fecha_hora
                    now = timezone.now()
                
                    # Permitir citas desde hoy en adelante (con algunos minutos de margen)
                    # Rechazar solo si es una fecha completamente anterior a hoy
                    if(user_rol != 'Administrador'):
                        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
                        if fecha_hora_aware < today_start:
                            return JsonResponse({'detail': 'No se puede agendar citas en fechas anteriores'}, status=400)
            except (ValueError, AttributeError):
                pass  # Si hay error al parsear fecha, dejar que continúe y falle gracefully
            
            # Validar que el empleado es el correcto según el rol
            empleado_id = data.get('empleado_id')
            
            if user_id and user_rol:
                # Usuario autenticado: validar permisos
                if user_rol == 'Empleado':
                    # Los empleados solo pueden crear citas para sí mismos
                    if int(empleado_id) != user_id:
                        return JsonResponse({'detail': 'No tienes permiso para crear citas para otros empleados'}, status=403)
            
            servicio = Servicio.objects.get(id=data['servicio_id'])
            tipo_servicio = data.get('tipo_servicio', 'local')
            
            if tipo_servicio == 'domicilio' and not servicio.permite_domicilio:
                return JsonResponse({'detail': 'Este servicio no está disponible a domicilio.'}, status=400)

            cliente = Cliente.objects.get(id=data['cliente_id'])
            celular = (cliente.celular or '').strip()
            if celular:
                fecha = parse_datetime(hora_inicio if es_rango else data.get('fecha_hora'))
                from django.db.models import Q
                citas_mismo_dia = Cita.objects.filter(
                    cliente__celular=celular,
                    fecha_hora__date=fecha.date(),
                ).count()
                if citas_mismo_dia >= 2:
                    return JsonResponse({'detail': 'Ya tienes 2 citas agendadas para este día con este celular.'}, status=400)

            if es_rango:
                cita = Cita(
                    cliente_id=data['cliente_id'],
                    empleado_id=data['empleado_id'],
                    servicio_id=data['servicio_id'],
                    fecha_hora=None,
                    hora_fin=None,
                    rango_inicio=parse_datetime(hora_inicio),
                    rango_fin=parse_datetime(hora_fin_rango),
                    estado='pendiente',
                    tipo_servicio=tipo_servicio,
                    cobertura_id=data.get('cobertura_id'),
                    direccion=data.get('direccion', ''),
                    notas=data.get('notas', ''),
                    tipo_reserva='rango',
                    precio_final=data.get('precio_final')
                )
                cita.save(force_insert=True)
            else:
                # Crear la cita primero sin hora_fin para calcularla
                cita = Cita(
                    cliente_id=data['cliente_id'],
                    empleado_id=data['empleado_id'],
                    servicio_id=data['servicio_id'],
                    fecha_hora=parse_datetime(data['fecha_hora']),
                    estado=data.get('estado', 'pendiente'),
                    tipo_servicio=tipo_servicio,
                    cobertura_id=data.get('cobertura_id'),
                    direccion=data.get('direccion', ''),
                    notas=data.get('notas', ''),
                    tipo_reserva='exacta',
                    precio_final=data.get('precio_final'),
                )
                # Calcular hora_fin automáticamente
                cita.save()  # Esto activa el método save() que calcula hora_fin
            
            # Validar solapamientos después de calcular hora_fin
            from django.core.exceptions import ValidationError
            try:
                if es_rango:
                # Validación manual para reservas por rango
                    if not cita.rango_inicio or not cita.rango_fin:
                        raise ValidationError(
                            'Debes seleccionar un rango de tiempo válido.'
                        )

                    if cita.rango_inicio >= cita.rango_fin:
                        raise ValidationError(
                            'La hora final debe ser mayor a la hora inicial.'
                        )
                else:
                    # Mantener validación actual de citas exactas
                    cita.full_clean()
            except ValidationError as e:
                cita.delete()  # Eliminar la cita si hay error de validación
                return JsonResponse({'detail': str(e)}, status=400)
            
            return JsonResponse({
                'id': cita.id,
                'message': 'Cita creada correctamente',
                'cita': {
                    'id': cita.id,
                    'cliente': cita.cliente.name,
                    'cliente_id': cita.cliente.id,
                    'cliente_celular': cita.cliente.celular,
                    'empleado': cita.empleado.name,
                    'empleado_id': cita.empleado.id,
                    'empleado_color': cita.empleado.color,
                    'servicio': cita.servicio.name,
                    'servicio_id': cita.servicio.id,
                    'servicio_tiempo': cita.servicio.tiempo,
                    'fecha_hora': serialize_datetime(cita.fecha_hora),
                    'hora_fin': serialize_datetime(cita.hora_fin),
                    'estado': cita.estado,
                    'tipo_servicio': cita.tipo_servicio,
                    'cobertura_id': cita.cobertura_id,
                    'cobertura': cita.cobertura.barrio.name if cita.cobertura else None,
                    'direccion': cita.direccion,
                    'notas': cita.notas,
                }
            })
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=400)
    
    return JsonResponse({'detail': 'Method not allowed'}, status=405)

@csrf_exempt
def citas_filter(request):
    if request.method == 'POST':
        try:
            # Verificar autenticación
            user_id = request.session.get('user_id')
            user_rol = request.session.get('user_rol')
            
            # Construir filtros dinámicamente
            filters = Q()  # Filtro vacío
            applied_filters = {}
            
            try:
                if request.body:
                    data = json.loads(request.body.decode('utf-8'))
                else:
                    data = {}
            except json.JSONDecodeError:
                data = {}


            # 1. Filtro por empleado
            empleado_id = data.get('empleado_id')
            if empleado_id and str(empleado_id).strip():
                try:
                    filters &= Q(empleado_id=int(empleado_id))
                    applied_filters['empleado_id'] = int(empleado_id)
                except (ValueError, TypeError):
                    pass

            # 2. Filtro por negocio (a través del empleado)
            negocio_id = data.get('negocio_id')
            if negocio_id and str(negocio_id).strip():
                try:
                    filters &= Q(empleado__negocio_id=int(negocio_id))
                    applied_filters['negocio_id'] = int(negocio_id)
                except (ValueError, TypeError):
                    pass
            
            # 5. Filtro por estado
            estado = data.get('estado')
            if estado and str(estado).strip():
                estados_validos = ['pendiente', 'confirmada', 'cancelada', 'completada']
                if estado in estados_validos:
                    filters &= Q(estado=estado)
                    applied_filters['estado'] = estado
                
            # 6. Filtro por rango de fechas (optimizado)
            fecha_inicio = data.get('fecha_inicio')
            if fecha_inicio and str(fecha_inicio).strip():
                try:
                    fecha_inicio_obj = datetime.strptime(fecha_inicio, '%Y-%m-%d').date()
                    filters &= (
                        Q(fecha_hora__date__gte=fecha_inicio_obj) |
                        Q(rango_inicio__date__gte=fecha_inicio_obj)
                    )
                    applied_filters['fecha_inicio'] = str(fecha_inicio_obj)
                except (ValueError, TypeError):
                    pass

            fecha_fin = data.get('fecha_fin')
            if fecha_fin and str(fecha_fin).strip():
                try:
                    fecha_fin_obj = datetime.strptime(fecha_fin, '%Y-%m-%d').date()
                    filters &= (
                        Q(fecha_hora__date__lte=fecha_fin_obj) |
                        Q(rango_fin__date__lte=fecha_fin_obj)
                    )
                    applied_filters['fecha_fin'] = str(fecha_fin_obj)
                except (ValueError, TypeError):
                    pass
            

            # APLICAR FILTROS EN LA BASE DE DATOS
            citas = Cita.objects.select_related(
                'cliente', 'empleado', 'servicio', 'cobertura'
            ).filter(filters)  # ← Aquí se filtra en la DB

            # Serializar solo los resultados filtrados
            citas_data = []
            for cita in citas:
                citas_data.append({
                    'id': cita.id,
                    'cliente': cita.cliente.name if cita.cliente else None,
                    'cliente_id': cita.cliente.id if cita.cliente else None,
                    'cliente_telefono': getattr(cita.cliente, 'telefono', '') if cita.cliente else '',
                    'empleado_id': cita.empleado.id if cita.empleado else None,
                    'empleado': cita.empleado.name if cita.empleado else None,
                    'servicio_id': cita.servicio.id if cita.servicio else None,
                    'servicio': cita.servicio.name if cita.servicio else None,
                    'tipo_reserva': cita.tipo_reserva,
                    'fecha_hora': cita.fecha_hora.isoformat() if cita.fecha_hora else None,
                    'rango_inicio': cita.rango_inicio.isoformat() if cita.rango_inicio else None,
                    'rango_fin': cita.rango_fin.isoformat() if cita.rango_fin else None,
                    'fecha_hora_confirmada': cita.fecha_hora_confirmada.isoformat() if cita.fecha_hora_confirmada else None,
                    'estado': cita.estado,
                    'tipo_servicio': cita.tipo_servicio,
                    'precio_final': float(cita.precio_final) if cita.precio_final else None,
                    'direccion': cita.direccion,
                    'notas': cita.notas,
                })

            return JsonResponse({
                'success': True,
                'total': len(citas_data),
                'citas': citas_data,
                'filtros_aplicados': applied_filters
            })  
        
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=400)
        
    


           

          

@csrf_exempt
@require_auth
def cita_detail(request, cita_id):
    """Get, update or delete a specific appointment"""
    try:
        cita = Cita.objects.select_related('cliente', 'empleado', 'servicio').get(id=cita_id)
    except Cita.DoesNotExist:
        return JsonResponse({'detail': 'Cita no encontrada'}, status=404)
    
    # Validar acceso según el rol
    if request.user_rol == 'Empleado' and cita.empleado_id != request.user_id:
        return JsonResponse({'detail': 'No tienes permiso para acceder a esta cita'}, status=403)
    
    if request.method == 'GET':
        data = {
            'id': cita.id,
            'cliente': cita.cliente.name,
            'cliente_id': cita.cliente.id,
            'cliente_celular': cita.cliente.celular,
            'empleado': cita.empleado.name,
            'empleado_id': cita.empleado.id,
            'empleado_color': cita.empleado.color,
            'servicio': cita.servicio.name,
            'servicio_id': cita.servicio.id,
            'servicio_tiempo': cita.servicio.tiempo,
            'fecha_hora': serialize_datetime(cita.fecha_hora),
            'hora_fin': serialize_datetime(cita.hora_fin),
            'estado': cita.estado,
            'tipo_servicio': cita.tipo_servicio,
            'cobertura_id': cita.cobertura_id,
            'cobertura': cita.cobertura.barrio.name if cita.cobertura else None,
            'direccion': cita.direccion,
            'notas': cita.notas,
        }
        return JsonResponse(data)
    
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body.decode('utf-8'))
            
            def parse_datetime(value):
                if isinstance(value, str):
                    return datetime.fromisoformat(value.replace('Z', '+00:00'))
                return value
            
            # Los empleados no pueden cambiar a quién está asignada la cita
            if request.user_rol == 'Empleado' and 'empleado_id' in data:
                if int(data['empleado_id']) != request.user_id:
                    return JsonResponse({'detail': 'No tienes permiso para cambiar el empleado asignado'}, status=403)
            
            # Actualizar los campos proporcionados
            if 'cliente_id' in data:
                cita.cliente_id = data['cliente_id']
            if 'empleado_id' in data:
                cita.empleado_id = data['empleado_id']
            if 'servicio_id' in data:
                cita.servicio_id = data['servicio_id']
                cita.hora_fin = None
            if 'fecha_hora' in data:
                cita.fecha_hora = parse_datetime(data['fecha_hora'])
                cita.hora_fin = None
            if 'estado' in data:
                cita.estado = data['estado']
            if 'tipo_servicio' in data:
                cita.tipo_servicio = data['tipo_servicio']
            if 'cobertura_id' in data:
                cita.cobertura_id = data.get('cobertura_id')
            if 'direccion' in data:
                cita.direccion = data.get('direccion', cita.direccion)
            if 'notas' in data:
                cita.notas = data['notas']
            if 'fecha_hora_confirmada' in data and data['fecha_hora_confirmada'] is not None:
                cita.fecha_hora_confirmada = parse_datetime(data['fecha_hora_confirmada'])
                cita.fecha_hora = parse_datetime(data['fecha_hora_confirmada'])
                cita.hora_fin = None
            
            # Guardar (esto recalcula hora_fin si fue necesario)
            cita.save()
            
            def serialize_dt(value):
                if isinstance(value, str):
                    return value
                return value.isoformat() if value else None
            
            return JsonResponse({
                'message': 'Cita actualizada correctamente',
                'cita': {
                    'id': cita.id,
                    'cliente': cita.cliente.name,
                    'cliente_id': cita.cliente.id,
                    'cliente_celular': cita.cliente.celular,
                    'empleado': cita.empleado.name,
                    'empleado_id': cita.empleado.id,
                    'empleado_color': cita.empleado.color,
                    'servicio': cita.servicio.name,
                    'servicio_id': cita.servicio.id,
                    'servicio_tiempo': cita.servicio.tiempo,
                    'fecha_hora': serialize_dt(cita.fecha_hora),
                    'hora_fin': serialize_dt(cita.hora_fin),
                    'estado': cita.estado,
                    'tipo_servicio': cita.tipo_servicio,
                    'cobertura_id': cita.cobertura_id,
                    'cobertura': cita.cobertura.barrio.name if cita.cobertura else None,
                    'direccion': cita.direccion,
                    'notas': cita.notas,
                }
            })
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=400)
    
    elif request.method == 'DELETE':
        try:
            cita.delete()
            return JsonResponse({'message': 'Cita eliminada correctamente'})
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=400)
    
    return JsonResponse({'detail': 'Method not allowed'}, status=405)
