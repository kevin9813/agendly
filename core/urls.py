from django.urls import path

from .views import (
    api_root,
    barrios_list,
    cita_detail,
    citas_list,
    citas_filter,
    cliente_detail,
    clientes_list,
    coberturas_list,
    dashboard_view,
    login_view,
    logout_view,
    me_view,
    negocio_detail,
    negocio_list,
    negocios_list_sucursales,
    negocio_detail_sucursales,
    sucursal_detail,
    sucursales_list,
    roles_list,
    servicio_detail,
    servicios_list,
    negocio_servicios_list,
    usuario_detail,
    usuarios_list,
    negocio_suscripcion,
    sucursal_horarios,
    guardar_imagen,
)

urlpatterns = [
    path('', api_root, name='api-root'),
    path('login/', login_view, name='api-login'),
    path('logout/', logout_view, name='api-logout'),
    path('me/', me_view, name='api-me'),
    path('dashboard/', dashboard_view, name='api-dashboard'),

    # Negocio CRUD
    path('negocios/', negocio_list, name='api-negocios'),
    path('negocios-sucursales/', negocios_list_sucursales, name='api-negocios-sucursales'),
    path('negocio-sucursales/<int:negocio_id>/', negocio_detail_sucursales, name='api-negocios-detail-sucursales'),
    path('negocios/<int:negocio_id>/', negocio_detail, name='api-negocio-detail'),
    path('sucursales/', sucursales_list, name='api-sucursales'),
    path('sucursales/<int:sucursal_id>/', sucursal_detail, name='api-sucursal-detail'),
    path('sucursal-horarios/<int:sucursal_id>/', sucursal_horarios, name='api-sucursal_horarios'),
    
    # Negocios Suscripciones
    path('negocio-suscripcion/<int:negocio_id>/', negocio_suscripcion, name='api-negocio-suscripcion'),

    # Servicio CRUD
    path('servicios/', servicios_list, name='api-servicios'),
    path('servicios/<int:servicio_id>/', servicio_detail, name='api-servicio-detail'),
    path('negocio/<int:negocio_id>/servicios/', negocio_servicios_list, name='api-servicios-negocio'),
 
    # Usuario CRUD
    path('usuarios/', usuarios_list, name='api-usuarios'),
    path('usuarios/<int:usuario_id>/', usuario_detail, name='api-usuario-detail'),

    # Roles, barrios y coberturas
    path('roles/', roles_list, name='api-roles'),
    path('barrios/', barrios_list, name='api-barrios'),
    path('coberturas/', coberturas_list, name='api-coberturas'),

    # List views for other entities
    path('clientes/', clientes_list, name='api-clientes'),
    path('clientes/<int:cliente_id>/', cliente_detail, name='api-cliente-detail'),
    path('citas/', citas_list, name='api-citas'),
    path('citas/<int:cita_id>/', cita_detail, name='api-cita-detail'),
    path('citas/filter/', citas_filter, name='api-citas-filter'),

    #subir archivos imagenes
    path('upload/', guardar_imagen, name='guardar-imagen'),
]
