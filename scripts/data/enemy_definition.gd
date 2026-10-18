class_name EnemyDefinition
extends Resource

@export var id: StringName = &"infantry_basic"
@export var display_name: String = "Infantaria"
@export_range(1.0, 100000.0, 1.0) var max_health: float = 100.0
@export_range(1.0, 10000.0, 1.0) var move_speed_px_s: float = 40.0
@export_range(0, 10000, 1) var objective_damage: int = 20
@export_range(1.0, 1000.0, 1.0) var barricade_attack_range_px: float = 128.0
@export_range(1, 10000, 1) var barricade_damage: int = 20
@export_range(0.05, 60.0, 0.05) var attack_interval_s: float = 1.0
@export_range(0, 10000, 1) var reward_materials: int = 5

