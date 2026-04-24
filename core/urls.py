from django.urls import path

from .views import (
    api_root,
    barrios_list,
    cita_detail,
    citas_list,
    cliente_detail,
    clientes_list,
    coberturas_list,
    dashboard_view,
    login_view,
    logout_view,
    me_view,
    negocio_detail,
    negocio_list,
    roles_list,
    servicio_detail,
    servicios_list,
    negocio_servicios_list,
    usuario_detail,
    usuarios_list,
)

urlpatterns = [
    path('', api_root, name='api-root'),
    path('login/', login_view, name='api-login'),
    path('logout/', logout_view, name='api-logout'),
    path('me/', me_view, name='api-me'),
    path('dashboard/', dashboard_view, name='api-dashboard'),

    # Negocio CRUD
    path('negocios/', negocio_list, name='api-negocios'),
    path('negocios/<int:negocio_id>/', negocio_detail, name='api-negocio-detail'),

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
]
