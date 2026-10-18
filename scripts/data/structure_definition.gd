class_name StructureDefinition
extends Resource

enum Kind {
	SHOOTER,
	BARRICADE,
}

enum PlacementRule {
	OPEN_OR_FIXED_SITE,
	FIXED_SITE_ONLY,
	BARRICADE_SITE_ONLY,
}

@export var id: StringName
@export var display_name: String
@export var kind: Kind = Kind.SHOOTER
@export var placement_rule: PlacementRule = PlacementRule.OPEN_OR_FIXED_SITE
@export_range(1, 10000, 1) var cost_materials: int = 60
## Deslocamentos relativos à célula âncora. A imagem pode exceder a pegada lógica.
@export var footprint_cells: Array[Vector2i] = [Vector2i(0, 0), Vector2i(1, 0)]
@export_range(1.0, 100000.0, 1.0) var max_health: float = 300.0
@export_range(0.0, 100000.0, 1.0) var attack_damage: float = 20.0
@export_range(0.05, 60.0, 0.05) var attack_interval_s: float = 1.2
@export_range(1.0, 10000.0, 1.0) var attack_range_px: float = 220.0

