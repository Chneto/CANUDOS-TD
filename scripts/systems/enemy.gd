class_name Enemy
extends PathFollow2D

signal health_changed(current: float, maximum: float)
signal removed_from_wave(enemy: Enemy)

enum State {
	MOVING,
	ATTACKING_BARRICADE,
	DEFEATED,
	REACHED_OBJECTIVE,
}

var definition: EnemyDefinition
var game_manager: GameManager
var barricade_sites: Array[BuildSiteDefinition] = []
var health: float = 0.0
var state: State = State.MOVING

var _path: Path2D
var _ordered_stops: Array[Dictionary] = []
var _next_stop_index: int = 0
var _active_barricade: Barricade
var _attack_timer: float = 0.0


## Configure antes de adicionar o nó à Path2D.
func configure(enemy_definition: EnemyDefinition, manager: GameManager, sites: Array[BuildSiteDefinition]) -> void:
	definition = enemy_definition
	game_manager = manager
	barricade_sites = sites.duplicate()
	if definition != null:
		health = definition.max_health


func _ready() -> void:
	add_to_group("enemies")
	loop = false
	# Sprites 3/4 ficam em pé; sem isso a PathFollow2D deita o soldado nos trechos verticais.
	rotates = false
	_path = get_parent() as Path2D
	if definition == null or game_manager == null or _path == null or _path.curve == null:
		push_error("Enemy precisa de definição, GameManager e Path2D pai")
		set_process(false)
		return

	_build_stop_offsets()
	health_changed.emit(health, definition.max_health)


func _process(delta: float) -> void:
	if state == State.MOVING:
		_advance(delta)
	elif state == State.ATTACKING_BARRICADE:
		_attack_barricade(delta)


func is_targetable() -> bool:
	return state == State.MOVING or state == State.ATTACKING_BARRICADE


func take_damage(amount: float) -> void:
	if not is_targetable() or amount <= 0.0:
		return

	health = maxf(0.0, health - amount)
	health_changed.emit(health, definition.max_health)
	if health <= 0.0:
		state = State.DEFEATED
		game_manager.report_enemy_defeated(definition.reward_materials)
		removed_from_wave.emit(self)
		queue_free()


func _build_stop_offsets() -> void:
	_ordered_stops.clear()
	for site in barricade_sites:
		if site == null or site.site_type != BuildSiteDefinition.SiteType.BARRICADE:
			continue
		var local_point := _path.to_local(site.attack_stop_point)
		var offset := _path.curve.get_closest_offset(local_point)
		_ordered_stops.append({"site_id": site.site_id, "offset": offset})
	_ordered_stops.sort_custom(func(a: Dictionary, b: Dictionary) -> bool: return a["offset"] < b["offset"])


func _advance(delta: float) -> void:
	var route_length := _path.curve.get_baked_length()
	var next_progress := minf(progress + definition.move_speed_px_s * delta, route_length)

	if _next_stop_index < _ordered_stops.size():
		var stop: Dictionary = _ordered_stops[_next_stop_index]
		if stop["offset"] >= progress and stop["offset"] <= next_progress:
			progress = stop["offset"]
			_next_stop_index += 1
			_active_barricade = _find_barricade(stop["site_id"])
			if _active_barricade != null:
				state = State.ATTACKING_BARRICADE
				_attack_timer = 0.0
			return

	progress = next_progress
	if progress >= route_length:
		state = State.REACHED_OBJECTIVE
		game_manager.report_enemy_reached_objective(definition.objective_damage)
		removed_from_wave.emit(self)
		queue_free()


func _attack_barricade(delta: float) -> void:
	if not is_instance_valid(_active_barricade) or _active_barricade.is_destroyed():
		_active_barricade = null
		state = State.MOVING
		return

	_attack_timer -= delta
	if _attack_timer > 0.0:
		return

	_active_barricade.take_damage(definition.barricade_damage)
	_attack_timer = definition.attack_interval_s
	if _active_barricade.is_destroyed():
		_active_barricade = null
		state = State.MOVING


func _find_barricade(site_id: StringName) -> Barricade:
	for candidate in get_tree().get_nodes_in_group("barricades"):
		if not (candidate is Barricade) or candidate.site_id != site_id or candidate.is_destroyed():
			continue
		if global_position.distance_to(candidate.global_position) > definition.barricade_attack_range_px:
			push_warning("A barricada %s está fora do alcance do ponto de parada" % site_id)
			return null
		return candidate
	return null
