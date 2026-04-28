from django.contrib.auth import get_user_model
from django.db.models.signals import post_migrate
from django.dispatch import receiver

from .models import Negocio, Rol, User, Ciudad, Barrio, Sucursal


@receiver(post_migrate)
def create_initial_data(sender, **kwargs):
    if sender.name != 'core':
        return

    barrios_cali = [
        # Norte
        "Granada", "Versalles", "Santa Mónica Residencial", "Santa Mónica Popular",
        "La Flora", "Chipichape", "Prados del Norte", "Vipasa",
        # Sur
        "Ciudad Jardín", "Valle del Lili", "El Caney", "Bochalema",
        "Pance", "El Ingenio", "Meléndez",
        # Centro
        "Centro", "San Antonio", "El Peñón", "San Fernando",
        "Tequendama", "Nueva Tequendama",
        # Oriente
        "Alfonso López", "Mariano Ramos", "El Vallado", "Mojica","El Retiro", "Compartir", 
        "Floralia", "Decepaz", "Poblado 2", "Comuneros 1", "Comuneros 2",
        # Otros
        "Calima", "Salomia", "Los Álamos", "La Base"
    ]

    cali, _ = Ciudad.objects.get_or_create(name='Cali')
    for nombre in barrios_cali:
        Barrio.objects.get_or_create(
            name=nombre, ciudad=cali
        )
    
    barrio, _ = Barrio.objects.get_or_create(name='Poblado 1', ciudad=cali)
    rol, _ = Rol.objects.get_or_create(name='Administrador')
    rol_empleado, _ = Rol.objects.get_or_create(name='Empleado')
    negocio, _ = Negocio.objects.get_or_create(name='MiNegocio')
    sucursal, _ = Sucursal.objects.get_or_create(name='MiSucursal',negocio=negocio,ciudad=cali,barrio=barrio)
    if not User.objects.filter(username='admin').exists():
        user = User(name='Administrador', username='admin', rol=rol, negocio=negocio, sucursal=sucursal)
        user.set_password('1234')
        user.save()

    UserModel = get_user_model()
    if not UserModel.objects.filter(username='admin').exists():
        UserModel.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='1234',
        )
