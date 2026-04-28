from django.contrib.auth.hashers import check_password, make_password
from django.db import models
from datetime import timedelta, datetime


class Plan(models.Model):
    name = models.CharField(max_length=150)
    precio = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'plan'

    def __str__(self):
        return self.name


class Ciudad(models.Model):
    name = models.CharField(max_length=50)

    class Meta:
        db_table = 'ciudad'

    def __str__(self):
        return self.name

class Barrio(models.Model):
    ciudad = models.ForeignKey(Ciudad, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)

    class Meta:
        db_table = 'barrio'

    def __str__(self):
        return self.name

class Negocio(models.Model):
    name = models.CharField(max_length=150)

    class Meta:
        db_table = 'negocio'

    def __str__(self):
        return self.name


class Sucursal(models.Model):
    negocio = models.ForeignKey(Negocio, on_delete=models.CASCADE, related_name='sucursales')
    name = models.CharField(max_length=150)
    direccion = models.CharField(max_length=255)
    tel = models.CharField(max_length=20, blank=True, help_text='Número de telefono de la sucursal')
    whatsapp = models.CharField(max_length=20, blank=True, help_text='Número de WhatsApp de la sucursal')
    ciudad = models.ForeignKey(Ciudad, on_delete=models.CASCADE)
    barrio = models.ForeignKey(Barrio, on_delete=models.CASCADE)
    horario = models.TextField(blank=True)
    permite_agendar = models.BooleanField(default=False)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = 'sucursal'

    def __str__(self):
        return f"{self.negocio.name} - {self.name}"


class NegocioSuscripcion(models.Model):
    negocio = models.ForeignKey(Negocio, on_delete=models.CASCADE, related_name='suscripciones')
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()

    class Meta:
        db_table = 'negocio_suscripcion'

    def __str__(self):
        return f"{self.negocio.name} - {self.plan.name}"

class Cobertura(models.Model):
    barrio = models.ForeignKey(Barrio, on_delete=models.CASCADE)
    costo_extra = models.DecimalField(max_digits=10, decimal_places=2)
    tiempo_estimado = models.IntegerField(help_text="Minutos de desplazamiento")
    activo = models.BooleanField(default=True)
    negocio = models.ForeignKey(Negocio, on_delete=models.CASCADE, related_name='config_barrios')
    sucursal = models.ForeignKey(Sucursal, on_delete=models.CASCADE, related_name='config_barrios')

    class Meta:
        unique_together = ('negocio', 'barrio')
        db_table = 'negocio_barrio'

    def __str__(self):
        return f"{self.negocio.name} - {self.barrio.name}"

class Rol(models.Model):
    name = models.CharField(max_length=150)

    class Meta:
        db_table = 'rol'

    def __str__(self):
        return self.name


class User(models.Model):
    name = models.CharField(max_length=150)
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=128)
    rol = models.ForeignKey(Rol, on_delete=models.PROTECT, db_column='id_rol', related_name='users')
    color = models.CharField(max_length=7, default='#4ECDC4', help_text='Color para identificar al usuario en la agenda (formato #RRGGBB)')
    whatsapp = models.CharField(max_length=20, blank=True, help_text='Número de WhatsApp del usuario')
    activo = models.BooleanField(default=True)
    negocio = models.ForeignKey(Negocio, on_delete=models.PROTECT, db_column='id_negocio', related_name='users')
    sucursal = models.ForeignKey(Sucursal, on_delete=models.PROTECT, db_column='id_sucursal', related_name='users')

    class Meta:
        db_table = 'user'

    def __str__(self):
        return self.username

    def set_password(self, raw_password):
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password)


class Servicio(models.Model):
    name = models.CharField(max_length=150)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    tiempo = models.IntegerField(help_text="Tiempo en minutos")
    permite_domicilio = models.BooleanField(default=False)
    notas = models.TextField(blank=True)
    negocio = models.ForeignKey(Negocio, on_delete=models.CASCADE, related_name='servicios')
    sucursal = models.ForeignKey(Sucursal, on_delete=models.CASCADE, related_name='servicios')

    class Meta:
        db_table = 'servicio'

    def __str__(self):
        return f"{self.name} - {self.negocio.name}"

class UserServicio(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_servicios')
    servicio = models.ForeignKey(Servicio, on_delete=models.CASCADE, related_name='user_servicios')

    class Meta:
        db_table = 'user_servicio'
        unique_together = ('user', 'servicio')

    def __str__(self):
        return f"{self.user.username} - {self.servicio.name}"


class Cliente(models.Model):
    name = models.CharField(max_length=150)
    celular = models.CharField(max_length=20, blank=True, help_text='Número de celular/WhatsApp')
    negocio = models.ForeignKey(Negocio, on_delete=models.CASCADE, related_name='clientes')
    sucursal = models.ForeignKey(Sucursal, on_delete=models.CASCADE, related_name='clientes')


    class Meta:
        db_table = 'cliente'

    def __str__(self):
        return f"{self.name} - {self.celular}" if self.celular else self.name


class Cita(models.Model):
    TIPO_SERVICIO = [('local', 'En local'),('domicilio', 'A domicilio'),('virtual', 'Virtual')]
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE, related_name='citas')
    empleado = models.ForeignKey(User, on_delete=models.CASCADE, related_name='citas_asignadas')
    servicio = models.ForeignKey(Servicio, on_delete=models.CASCADE, related_name='citas')
    fecha_hora = models.DateTimeField()
    hora_fin = models.DateTimeField(help_text='Hora de finalización calculada automáticamente')
    estado = models.CharField(max_length=20, choices=[
        ('pendiente', 'Pendiente'),('confirmada', 'Confirmada'),
        ('cancelada', 'Cancelada'),('completada', 'Completada'),
    ], default='pendiente')
    tipo_servicio = models.CharField(max_length=20, choices=TIPO_SERVICIO, default='local')
    cobertura = models.ForeignKey(Cobertura, null=True, blank=True, on_delete=models.SET_NULL)
    direccion = models.TextField(blank=True, null=True)
    notas = models.TextField(blank=True)

    class Meta:
        db_table = 'cita'

    def __str__(self):
        return f"{self.cliente.name} - {self.servicio.name} - {self.fecha_hora}"

    def save(self, *args, **kwargs):
        # Calcular hora_fin automáticamente si no está definida
        if not self.hora_fin and self.fecha_hora and self.servicio:
            # Convertir fecha_hora a datetime si es un string
            fecha_hora = self.fecha_hora
            if isinstance(fecha_hora, str):
                fecha_hora = datetime.fromisoformat(fecha_hora.replace('Z', '+00:00'))
            
            self.hora_fin = fecha_hora + timedelta(minutes=self.servicio.tiempo)
        super().save(*args, **kwargs)

    def clean(self):
        from django.core.exceptions import ValidationError
        # Validar que no haya solapamiento con otras citas del mismo empleado
        if self.fecha_hora and self.hora_fin and self.empleado:
            citas_solapadas = Cita.objects.filter(
                empleado=self.empleado,
                fecha_hora__lt=self.hora_fin,
                hora_fin__gt=self.fecha_hora
            ).exclude(pk=self.pk)  # Excluir la cita actual si está siendo editada

            if citas_solapadas.exists():
                raise ValidationError(f"El empleado {self.empleado.name} ya tiene una cita programada en este horario.")
            if self.tipo_servicio == 'domicilio' and not self.servicio.permite_domicilio:
                raise ValidationError("Este servicio no está disponible a domicilio.")
            if self.tipo_servicio == 'domicilio' and not self.direccion:
                raise ValidationError("La dirección es obligatoria para citas a domicilio.")
