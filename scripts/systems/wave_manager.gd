class_name WaveManager
extends Node

signal wave_started(wave_number: int)
signal spawn_count_changed(spawned: int, total: int)
signal wave_spawning_finished
signal enemy_spawned(enemy: Enemy)

@export var game_manager: GameManager
@export var map_definition: MapDefinition
@export var path_node: Path2D
@export var enemy_scene: PackedScene
@export var enemy_definition: EnemyDefinition
@export_range(1, 100, 1) var enemies_in_wave: int = 6
@export_range(0.1, 10.0, 0.1) var spawn_interval_s: float = 1.0

var _timer: Timer
var _spawned_count: int = 0


func _ready() -> void:
	if game_manager != null:
		game_manager.run_reset.connect(_on_run_reset)
	_timer = Timer.new()
	_timer.one_shot = true
	_timer.timeout.connect(_spawn_next_enemy)
	add_child(_timer)


func start_wave() -> bool:
	if game_manager == null or path_node == null or map_definition == null or enemy_scene == null or enemy_definition == null:
		push_error("WaveManager está sem configuração obrigatória")
		return false
	if not map_definition.validate_definition().is_empty():
		push_error("MapDefinition inválido; consulte validate_definition()")
		return false
	if not game_manager.start_wave():
		return false

	_spawned_count = 0
	wave_started.emit(game_manager.current_wave)
	spawn_count_changed.emit(0, enemies_in_wave)
	if enemies_in_wave <= 0:
		_finish_spawning()
	else:
		_spawn_next_enemy()
	return true


func _spawn_next_enemy() -> void:
	if game_manager == null or game_manager.phase != GameManager.Phase.WAVE_ACTIVE:
		_timer.stop()
		return
	if _spawned_count >= enemies_in_wave:
		_finish_spawning()
		return

	var enemy := enemy_scene.instantiate() as Enemy
	if enemy == null:
		push_error("enemy_scene precisa ter um nó raiz Enemy")
		_timer.stop()
		return

	enemy.configure(enemy_definition, game_manager, map_definition.barricade_sites)
	if not game_manager.register_enemy_spawned():
		enemy.free()
		_timer.stop()
		return
	path_node.add_child(enemy)
	enemy_spawned.emit(enemy)
	_spawned_count += 1
	spawn_count_changed.emit(_spawned_count, enemies_in_wave)

	if _spawned_count >= enemies_in_wave:
		_finish_spawning()
	else:
		_timer.start(spawn_interval_s)


func _finish_spawning() -> void:
	_timer.stop()
	wave_spawning_finished.emit()
	game_manager.finish_enemy_spawning()


func _on_run_reset() -> void:
	_timer.stop()
	_spawned_count = 0
	if path_node == null:
		return
	for child in path_node.get_children():
		if child is Enemy:
			child.queue_free()
