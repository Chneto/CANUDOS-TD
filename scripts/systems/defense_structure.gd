class_name DefenseStructure
extends Node2D

signal attack_fired(target: Enemy)

var definition: StructureDefinition
var game_manager: GameManager
var health: float = 0.0

var _attack_timer: float = 0.0


## Configure antes de adicionar o nó à cena.
func configure(structure: StructureDefinition, manager: GameManager) -> void:
	definition = structure
	game_manager = manager
	if definition != null:
		health = definition.max_health


func _ready() -> void:
	add_to_group("defenses")
	if definition == null or definition.kind != StructureDefinition.Kind.SHOOTER:
		push_error("DefenseStructure requer uma StructureDefinition do tipo SHOOTER")
		set_process(false)


func _process(delta: float) -> void:
	if definition == null or game_manager == null or game_manager.phase != GameManager.Phase.WAVE_ACTIVE:
		return

	_attack_timer = maxf(0.0, _attack_timer - delta)
	if _attack_timer > 0.0:
		return

	var target := _select_target()
	if target == null:
		return

	_attack_timer = definition.attack_interval_s
	attack_fired.emit(target)
	target.take_damage(definition.attack_damage)


func _select_target() -> Enemy:
	var best_target: Enemy
	var best_progress := -INF
	for candidate in get_tree().get_nodes_in_group("enemies"):
		if not (candidate is Enemy) or not candidate.is_targetable():
			continue
		var enemy := candidate as Enemy
		if global_position.distance_to(enemy.global_position) > definition.attack_range_px:
			continue
		if enemy.progress > best_progress:
			best_progress = enemy.progress
			best_target = enemy
	return best_target

