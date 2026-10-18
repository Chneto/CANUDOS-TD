class_name BuildSiteDefinition
extends Resource

enum SiteType {
	FIXED_STRUCTURE,
	BARRICADE,
}

@export var site_id: StringName
@export var site_type: SiteType = SiteType.FIXED_STRUCTURE
@export var cells: Array[Vector2i] = []
## Posição global do inimigo na Path2D ao parar para atacar a barricada.
@export var attack_stop_point: Vector2 = Vector2.ZERO
