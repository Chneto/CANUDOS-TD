class_name ChampionConselheiro
extends Node2D

## Representa Antônio Conselheiro como Campeão comunitário no Godot 4.3.
## Líder espiritual e comunitário: não ataca e não é alvejado.
## Concede aura de aceleração de disparo a atiradores próximos quando parado,
## e opera as habilidades Mutirão (reparo/conclusão de obras) e Prédica (fé e tenacidade).

signal champion_moved(new_grid_pos: Vector2i)
signal aura_state_changed(is_active: bool)
signal mutirao_activated(repaired_count: int)
signal predica_activated(duration_s: float)
signal predica_ended
signal cooldowns_updated(mutirao_cd: float, predica_cd: float)

const SPEED_PREPARATION: float = 140.0 # px/s na preparação
const SPEED_COMBAT: float = 60.0       # px/s no combate
const AURA_RADIUS_PX: float = 192.0    # 3 células de 64px
const MUTIRAO_RADIUS_PX: float = 256.0 # 4 células de 64px
const PREDICA_RADIUS_PX: float = 288.0 # 4.5 células de 64px
const MUTIRAO_COOLDOWN: float = 35.0   # segundos
const PREDICA_COOLDOWN: float = 30.0   # segundos
const PREDICA_DURATION: float = 8.0    # segundos
const REPAIR_AMOUNT: float = 150.0

@export var map_definition: MapDefinition
@export var game_manager: GameManager

var current_cell: Vector2i = Vector2i(17, 6) # Próximo à Igreja de Canudos
var target_cell: Vector2i = Vector2i(17, 6)
var target_pos: Vector2 = Vector2.ZERO
var is_moving: bool = false

var mutirao_cd_timer: float = 0.0
var predica_cd_timer: float = 0.0
var predica_active_timer: float = 0.0

var _aura_pulse_time: float = 0.0


func _ready() -> void:
	add_to_group("champions")
	if map_definition != null:
		global_position = map_definition.cell_to_world_center(current_cell)
	target_pos = global_position
	queue_redraw()


func _process(delta: float) -> void:
	_aura_pulse_time += delta

	# Movimento interpolado
	if is_moving:
		var spd := SPEED_COMBAT if (game_manager != null and game_manager.phase == GameManager.Phase.WAVE_ACTIVE) else SPEED_PREPARATION
		global_position = global_position.move_toward(target_pos, spd * delta)
		if global_position.distance_to(target_pos) < 1.0:
			global_position = target_pos
			is_moving = false
			current_cell = target_cell
			champion_moved.emit(current_cell)
			aura_state_changed.emit(true)
			queue_redraw()
	else:
		# Pulsar visual da aura quando parado
		queue_redraw()

	# Atualização de recargas
	var prev_m := mutirao_cd_timer
	var prev_p := predica_cd_timer

	if mutirao_cd_timer > 0.0:
		mutirao_cd_timer = maxf(0.0, mutirao_cd_timer - delta)

	if predica_cd_timer > 0.0:
		predica_cd_timer = maxf(0.0, predica_cd_timer - delta)

	if predica_active_timer > 0.0:
		predica_active_timer = maxf(0.0, predica_active_timer - delta)
		if predica_active_timer == 0.0:
			predica_ended.emit()
			queue_redraw()

	if prev_m != mutirao_cd_timer or prev_p != predica_cd_timer:
		cooldowns_updated.emit(mutirao_cd_timer, predica_cd_timer)


func move_to_cell(new_cell: Vector2i) -> bool:
	if map_definition == null:
		return false
	if not map_definition.is_inside_grid(new_cell):
		return false
	if map_definition.is_road(new_cell):
		return false # O Conselheiro anda livremente fora da estrada

	target_cell = new_cell
	target_pos = map_definition.cell_to_world_center(new_cell)
	is_moving = true
	aura_state_changed.emit(false)
	return true


func is_in_aura(pos: Vector2) -> bool:
	if is_moving:
		return false
	return global_position.distance_to(pos) <= AURA_RADIUS_PX


func is_in_predica_buff(pos: Vector2) -> bool:
	if predica_active_timer <= 0.0:
		return false
	return global_position.distance_to(pos) <= PREDICA_RADIUS_PX


func can_use_mutirao() -> bool:
	return mutirao_cd_timer <= 0.0


func use_mutirao() -> Dictionary:
	if not can_use_mutirao():
		return {"ok": false, "reason": "Mutirão em recarga (%.1fs)" % mutirao_cd_timer}

	mutirao_cd_timer = MUTIRAO_COOLDOWN
	var repaired := 0

	for node in get_tree().get_nodes_in_group("barricades"):
		var b := node as Barricade
		if b != null and is_instance_valid(b):
			if global_position.distance_to(b.global_position) <= MUTIRAO_RADIUS_PX:
				b.repair(REPAIR_AMOUNT)
				repaired += 1

	mutirao_activated.emit(repaired)
	_play_ability_fx(Color(0.9, 0.75, 0.3, 0.7))
	return {"ok": true, "repaired": repaired}


func can_use_predica() -> bool:
	if game_manager != null and game_manager.phase != GameManager.Phase.WAVE_ACTIVE:
		return false # Prédica é invocada no combate
	return predica_cd_timer <= 0.0


func use_predica() -> Dictionary:
	if not can_use_predica():
		if game_manager != null and game_manager.phase != GameManager.Phase.WAVE_ACTIVE:
			return {"ok": false, "reason": "Prédica só pode ser rezada durante o combate."}
		return {"ok": false, "reason": "Prédica em recarga (%.1fs)" % predica_cd_timer}

	predica_cd_timer = PREDICA_COOLDOWN
	predica_active_timer = PREDICA_DURATION
	predica_activated.emit(PREDICA_DURATION)
	_play_ability_fx(Color(0.4, 0.7, 1.0, 0.8))
	queue_redraw()
	return {"ok": true, "duration": PREDICA_DURATION}


func _play_ability_fx(col: Color) -> void:
	var fx := CPUParticles2D.new()
	fx.emitting = true
	fx.one_shot = true
	fx.explosiveness = 0.9
	fx.amount = 24
	fx.lifetime = 0.6
	fx.direction = Vector2(0, -1)
	fx.spread = 180.0
	fx.initial_velocity_min = 40.0
	fx.initial_velocity_max = 90.0
	fx.color = col
	fx.scale_amount_min = 2.5
	fx.scale_amount_max = 5.0
	add_child(fx)

	var tw := create_tween()
	tw.tween_interval(0.7)
	tw.tween_callback(fx.queue_free)


func _draw() -> void:
	# Desenha aura dourada sutil quando parado
	if not is_moving:
		var pulse := 0.08 + 0.03 * sin(_aura_pulse_time * 3.0)
		draw_circle(Vector2.ZERO, AURA_RADIUS_PX, Color(0.92, 0.75, 0.3, pulse))
		draw_arc(Vector2.ZERO, AURA_RADIUS_PX, 0, TAU, 32, Color(0.92, 0.75, 0.3, 0.3), 1.5)

	# Desenha halo azul de oração da Prédica quando ativa
	if predica_active_timer > 0.0:
		var p_pulse := 0.12 + 0.05 * sin(_aura_pulse_time * 5.0)
		draw_circle(Vector2.ZERO, PREDICA_RADIUS_PX, Color(0.3, 0.6, 0.95, p_pulse))
		draw_arc(Vector2.ZERO, PREDICA_RADIUS_PX, 0, TAU, 36, Color(0.4, 0.7, 1.0, 0.5), 2.0)
