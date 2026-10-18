class_name PlacementManager
extends Node2D

signal placement_preview_changed(cell: Vector2i, valid: bool, reason: String)
signal structure_placed(structure: Node2D, definition: StructureDefinition, cells: Array[Vector2i])

@export var map_definition: MapDefinition
@export var game_manager: GameManager
@export var shooter_scene: PackedScene
@export var barricade_scene: PackedScene

var _occupied_cells: Dictionary = {}
var _occupied_sites: Dictionary = {}


func _ready() -> void:
	if game_manager != null:
		game_manager.run_reset.connect(_on_run_reset)


## Chamado pela interface durante o movimento do cursor. A UI desenha verde/vermelho.
func preview_at(definition: StructureDefinition, anchor_cell: Vector2i) -> Dictionary:
	var result := placement_status(definition, anchor_cell)
	placement_preview_changed.emit(anchor_cell, result["valid"], result["reason"])
	return result


func placement_status(definition: StructureDefinition, anchor_cell: Vector2i) -> Dictionary:
	if definition == null or map_definition == null or game_manager == null:
		return _status(false, "configuração de construção incompleta")
	if game_manager.phase == GameManager.Phase.VICTORY or game_manager.phase == GameManager.Phase.DEFEAT:
		return _status(false, "a partida já terminou")

	var site: BuildSiteDefinition = _find_matching_site(definition, anchor_cell)
	var cells: Array[Vector2i] = _cells_for_placement(definition, anchor_cell, site)
	if cells.is_empty():
		return _status(false, "posição incompatível com esta estrutura")
	if not _cells_have_valid_terrain(definition, cells, site):
		return _status(false, "terreno ou ponto reservado incompatível")
	for cell in cells:
		if _is_cell_occupied(cell):
			return _status(false, "a área já está ocupada")
	if site != null and _is_site_occupied(site.site_id):
		return _status(false, "o ponto reservado já está ocupado")
	if game_manager.materials < definition.cost_materials:
		return _status(false, "materiais insuficientes")
	return _status(true, "")


func place_structure(definition: StructureDefinition, anchor_cell: Vector2i) -> Node2D:
	var status := placement_status(definition, anchor_cell)
	if not status["valid"]:
		placement_preview_changed.emit(anchor_cell, false, status["reason"])
		return null

	var site := _find_matching_site(definition, anchor_cell)
	var cells := _cells_for_placement(definition, anchor_cell, site)
	var packed_scene := barricade_scene if definition.kind == StructureDefinition.Kind.BARRICADE else shooter_scene
	if packed_scene == null:
		push_error("Cena da estrutura não foi atribuída no Inspector")
		return null

	var structure := packed_scene.instantiate() as Node2D
	if structure == null:
		push_error("A cena de estrutura precisa ter raiz Node2D")
		return null
	if definition.kind == StructureDefinition.Kind.BARRICADE and not structure is Barricade:
		push_error("A cena de barricada precisa usar Barricade como script raiz")
		structure.free()
		return null
	if definition.kind == StructureDefinition.Kind.SHOOTER and not structure is DefenseStructure:
		push_error("A cena de atirador precisa usar DefenseStructure como script raiz")
		structure.free()
		return null
	if not game_manager.try_spend_materials(definition.cost_materials):
		structure.free()
		return null

	var world_position := _cells_center(cells)
	if structure is Barricade:
		structure.configure(definition, game_manager, site.site_id)
	else:
		structure.configure(definition, game_manager)
	add_child(structure)
	structure.global_position = world_position
	for cell in cells:
		_occupied_cells[cell] = structure
	if site != null:
		_occupied_sites[site.site_id] = structure
	structure.tree_exited.connect(_release_placement.bind(cells, site.site_id if site != null else &""), CONNECT_ONE_SHOT)
	structure_placed.emit(structure, definition, cells)
	return structure


func _cells_for_placement(definition: StructureDefinition, anchor: Vector2i, site: BuildSiteDefinition) -> Array[Vector2i]:
	if definition.placement_rule == StructureDefinition.PlacementRule.BARRICADE_SITE_ONLY:
		if site == null or site.site_type != BuildSiteDefinition.SiteType.BARRICADE:
			return []
		return site.cells.duplicate()
	if definition.placement_rule == StructureDefinition.PlacementRule.FIXED_SITE_ONLY:
		if site == null or site.site_type != BuildSiteDefinition.SiteType.FIXED_STRUCTURE:
			return []
		return site.cells.duplicate()
	if site != null and site.site_type == BuildSiteDefinition.SiteType.FIXED_STRUCTURE:
		return site.cells.duplicate()

	var cells: Array[Vector2i] = []
	for offset in definition.footprint_cells:
		cells.append(anchor + offset)
	return cells


func _find_matching_site(definition: StructureDefinition, anchor: Vector2i) -> BuildSiteDefinition:
	if definition.placement_rule == StructureDefinition.PlacementRule.BARRICADE_SITE_ONLY:
		return _find_site_containing(map_definition.barricade_sites, anchor)
	if definition.placement_rule == StructureDefinition.PlacementRule.FIXED_SITE_ONLY:
		return _find_site_containing(map_definition.fixed_sites, anchor)
	var fixed_site := _find_site_containing(map_definition.fixed_sites, anchor)
	if fixed_site != null:
		return fixed_site
	return null


func _find_site_containing(sites: Array[BuildSiteDefinition], cell: Vector2i) -> BuildSiteDefinition:
	for site in sites:
		if site != null and site.cells.has(cell):
			return site
	return null


func _cells_have_valid_terrain(definition: StructureDefinition, cells: Array[Vector2i], site: BuildSiteDefinition) -> bool:
	for cell in cells:
		var cell_type := map_definition.cell_type_at(cell)
		if cell_type < 0:
			return false
		if definition.kind == StructureDefinition.Kind.BARRICADE:
			if site == null or cell_type != MapDefinition.CellType.BARRICADE_SITE:
				return false
		elif cell_type == MapDefinition.CellType.OPEN:
			if definition.placement_rule == StructureDefinition.PlacementRule.FIXED_SITE_ONLY:
				return false
		elif cell_type == MapDefinition.CellType.FIXED_SITE:
			if site == null or site.site_type != BuildSiteDefinition.SiteType.FIXED_STRUCTURE:
				return false
		else:
			return false
	if definition.kind == StructureDefinition.Kind.BARRICADE:
		return map_definition.barricade_site_for_cells(cells) == site
	if site != null:
		return site.site_type == BuildSiteDefinition.SiteType.FIXED_STRUCTURE and map_definition.fixed_site_for_cells(cells) == site
	return true


func _cells_center(cells: Array[Vector2i]) -> Vector2:
	var center := Vector2.ZERO
	for cell in cells:
		center += map_definition.cell_center(cell)
	return to_global(center / float(cells.size()))


func _is_cell_occupied(cell: Vector2i) -> bool:
	if not _occupied_cells.has(cell):
		return false
	return is_instance_valid(_occupied_cells[cell])


func _is_site_occupied(site_id: StringName) -> bool:
	if not _occupied_sites.has(site_id):
		return false
	return is_instance_valid(_occupied_sites[site_id])


func _release_placement(cells: Array[Vector2i], site_id: StringName) -> void:
	for cell in cells:
		_occupied_cells.erase(cell)
	if not site_id.is_empty():
		_occupied_sites.erase(site_id)


func _on_run_reset() -> void:
	for child in get_children():
		if child is DefenseStructure or child is Barricade:
			child.queue_free()
	_occupied_cells.clear()
	_occupied_sites.clear()


func _status(valid: bool, reason: String) -> Dictionary:
	return {"valid": valid, "reason": reason}

