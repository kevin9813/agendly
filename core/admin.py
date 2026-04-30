from django.contrib import admin
from django import forms

from .models import Cita, Cliente, Negocio, Sucursal, Rol, Servicio, User, Ciudad, Barrio, Cobertura, UserServicio, NegocioSuscripcion, Plan


class CitaForm(forms.ModelForm):
    class Meta:
        model = Cita
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Ocultar cobertura y direccion si no es domicilio
        tipo_servicio = self.data.get('tipo_servicio') if self.data else self.instance.tipo_servicio if self.instance.pk else None
        if tipo_servicio != 'domicilio':
            self.fields['cobertura'].widget = forms.HiddenInput()
            self.fields['direccion'].widget = forms.HiddenInput()


class UserServicioInline(admin.TabularInline):
    model = UserServicio
    extra = 1
    autocomplete_fields = ['servicio']


@admin.register(Ciudad)
class CiudadAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)

@admin.register(Barrio)
class BarrioAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'ciudad')
    search_fields = ('name', 'ciudad__name')
    list_filter = ('ciudad',)


@admin.register(Negocio)
class NegocioAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)

@admin.register(Sucursal)
class SucursalAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'negocio')
    search_fields = ('name', 'negocio__name')

@admin.register(NegocioSuscripcion)
class NegocioSuscripcionAdmin(admin.ModelAdmin):
    list_display = ('id', 'negocio', 'plan', 'fecha_inicio', 'fecha_fin')
    search_fields = ('negocio__name', 'plan')
    list_filter = ('plan', 'negocio')

@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'precio')
    search_fields = ('name',)

@admin.register(Cobertura)
class CoberturaAdmin(admin.ModelAdmin):
    list_display = ('id', 'negocio', 'barrio', 'costo_extra', 'tiempo_estimado', 'activo')
    search_fields = ('negocio__name', 'barrio__name')
    list_filter = ('activo', 'negocio')

@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'username', 'rol', 'negocio')
    search_fields = ('name', 'username')
    list_filter = ('rol', 'negocio')
    inlines = [UserServicioInline]


@admin.register(Servicio)
class ServicioAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'precio', 'tiempo', 'permite_domicilio', 'notas', 'negocio')
    search_fields = ('name',)
    list_filter = ('negocio', 'permite_domicilio')


@admin.register(UserServicio)
class UserServicioAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'servicio')
    search_fields = ('user__name', 'servicio__name')
    list_filter = ('user__negocio',)


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)


@admin.register(Cita)
class CitaAdmin(admin.ModelAdmin):
    form = CitaForm
    list_display = ('id', 'cliente', 'empleado', 'servicio', 'fecha_hora', 'estado', 'tipo_servicio', 'cobertura', 'direccion')
    search_fields = ('cliente__name', 'empleado__name', 'servicio__name')
    list_filter = ('estado', 'fecha_hora', 'servicio__negocio', 'tipo_servicio')
