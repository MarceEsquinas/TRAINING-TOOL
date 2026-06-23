# TRAINNING tool



##### **Aplicación web para la gestión de atletas y la planificación semanal de entrenamientos personalizados basada en el seguimiento continuo de su evolución hacia un objetivo depo**rtivo.



1 --**El obejtivo** de mi app es gestionar los entrenamientos de un atleta mediante feedback que me da el.



###### 2-    **\*\*\*NEGOCIO\***\*\*

&#x20;     HABLAR CON ATLETA----CONOCER SU OBJETIVO---CREAR ENTRENAMIENTOS SEMANALES----RECIBIR FEEDBACK--ADAPTAR A LA SEMANA SIGUIENTE



3--**ficha atleta**

Nombre-------------------------------------------------------------MARCE

Sexo---------------------------------------------------------------M

Peso---------------------------------------------------------------70

Días disponibles---------------------------------------------------4

Km medios últimos 2 meses------------------------------------------70

Lesiones último año------------------------------------------------0



4-**-MODELO CONCEPTUAL**

**Atleta**

&#x20; **│**

&#x20; **└── 1:N Objetivo**

&#x20;           **│**

&#x20;           **└── 1:N SemanaEntrenamiento**

&#x20;                        **│**

&#x20;                        **├── 1:N SesionEntrenamiento**

&#x20;                        **│**

&#x20;                        **└── 1:1 FeedbackSemanal**

