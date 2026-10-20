class_name Barricade
extends Node2D

signal health_changed(current: float, maximum: float)
signal damaged(amount: float)
signal destroyed(site_id: StringName)

var definition: StructureDefinition
var game_manager: GameManager
var site_id: StringName
var health: float = 0.0
var _destroyed: bool = false


## Configure antes de adicionar o nó à cena.
func configure(structure: StructureDefinition, manager: GameManager, build_site_id: StringName) -> void:
	definition = structure
	game_manager = manager
	site_id = build_site_id
	if definition != null:
		health = definition.max_health


func _ready() -> void:
	add_to_group("barricades")
	if definition == null or definition.kind != StructureDefinition.Kind.BARRICADE:
		push_error("Barricade requer uma StructureDefinition do tipo BARRICADE")
		set_process(false)
		return
	health_changed.emit(health, definition.max_health)


func take_damage(amount: float) -> void:
	if _destroyed or amount <= 0.0:
		return

	# Redução de 50% de dano se a Prédica do Conselheiro estiver ativa no alcance
	var final_damage := amount
	var champions := get_tree().get_nodes_in_group("champions")
	for node in champions:
		if node is ChampionConselheiro and node.is_in_predica_buff(global_position):
			final_damage *= 0.5
			break

	health = maxf(0.0, health - final_damage)
	health_changed.emit(health, definition.max_health)
	damaged.emit(final_damage)
	_play_hit_shake()

	if health <= 0.0:
		_destroyed = true
		destroyed.emit(site_id)
		queue_free()


func repair(amount: float) -> void:
	if _destroyed or amount <= 0.0:
		return

	health = minf(definition.max_health, health + amount)
	health_changed.emit(health, definition.max_health)

	var sprite := get_node_or_null("Sprite2D") as Sprite2D
	if sprite != null and is_instance_valid(sprite):
		var tw := create_tween()
		sprite.modulate = Color(1.2, 1.8, 1.2) # flash esverdeado de conserto/mutirão
		tw.tween_property(sprite, "modulate", Color.WHITE, 0.25)


func _play_hit_shake() -> void:
	var sprite := get_node_or_null("Sprite2D") as Sprite2D
	if sprite != null and is_instance_valid(sprite):
		var tw := create_tween()
		sprite.modulate = Color(1.8, 1.3, 0.9) # flash de terra/poeira de taipa
		tw.tween_property(sprite, "modulate", Color.WHITE, 0.1)
		tw.parallel().tween_property(sprite, "position:x", randf_range(-3.0, 3.0), 0.04)
		tw.tween_property(sprite, "position:x", 0.0, 0.05)


func is_destroyed() -> bool:
	return _destroyed
