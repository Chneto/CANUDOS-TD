class_name MapDefinition
extends Resource

enum CellType {
	OPEN,
	SPAWN,
	PATH,
	BARRICADE_SITE,
	FIXED_SITE,
	OBJECTIVE,
}

@export var map_id: StringName = &"canudos_mvp"
@export var grid_size: Vector2i = Vector2i(20, 11)
@export_range(1, 512, 1) var cell_size_px: int = 64
## Uma entrada por célula, ordenadas por linha: índice = linha * largura + coluna.
@export var cell_types: PackedInt32Array = PackedInt32Array()
@export var spawn_positions: PackedVector2Array = PackedVector2Array()
@export var path_points: PackedVector2Array = PackedVector2Array()
@export var objective_cells: Array[Vector2i] = []
@export var barricade_sites: Array[BuildSiteDefinition] = []
@export var fixed_sites: Array[BuildSiteDefinition] = []


func is_in_bounds(cell: Vector2i) -> bool:
	return cell.x >= 0 and cell.y >= 0 and cell.x < grid_size.x and cell.y < grid_size.y


func cell_type_at(cell: Vector2i) -> int:
	if not is_in_bounds(cell):
		return -1
	var index := cell.y * grid_size.x + cell.x
	if index >= cell_types.size():
		return -1
	return cell_types[index]


func cell_center(cell: Vector2i) -> Vector2:
	return Vector2((cell.x + 0.5) * cell_size_px, (cell.y + 0.5) * cell_size_px)


func barricade_site_for_cells(cells: Array[Vector2i]) -> BuildSiteDefinition:
	for site in barricade_sites:
		if _same_cells(site.cells, cells):
			return site
	return null


func fixed_site_for_cells(cells: Array[Vector2i]) -> BuildSiteDefinition:
	for site in fixed_sites:
		if _same_cells(site.cells, cells):
			return site
	return null


func validate_definition() -> PackedStringArray:
	var errors := PackedStringArray()
	if grid_size.x <= 0 or grid_size.y <= 0:
		errors.append("grid_size precisa ter dimensões positivas")
		return errors
	if cell_types.size() != grid_size.x * grid_size.y:
		errors.append("cell_types deve conter uma entrada por célula")
	for point in spawn_positions:
		if point.x < 0.0 or point.y < 0.0 or point.x >= grid_size.x * cell_size_px or point.y >= grid_size.y * cell_size_px:
			errors.append("há ponto de surgimento fora dos limites do mapa")
			break
	if path_points.size() < 2:
		errors.append("path_points precisa conter pelo menos dois pontos")
	for cell in objective_cells:
		if cell_type_at(cell) != CellType.OBJECTIVE:
			errors.append("célula de objetivo não está marcada como OBJECTIVE")
			break
	if spawn_positions.is_empty():
		errors.append("o mapa precisa ter ao menos um ponto de surgimento")
	for point in path_points:
		if point.x < 0.0 or point.y < 0.0 or point.x >= grid_size.x * cell_size_px or point.y >= grid_size.y * cell_size_px:
			errors.append("há waypoint fora dos limites do mapa")
			break
	for site in barricade_sites:
		if site == null or String(site.site_id).is_empty() or site.cells.is_empty():
			errors.append("há um local de barricada sem ID ou células")
			continue
		if not _point_is_on_path(site.attack_stop_point):
			errors.append("attack_stop_point de %s não está na rota" % site.site_id)
		for cell in site.cells:
			if cell_type_at(cell) != CellType.BARRICADE_SITE:
				errors.append("célula de %s não está marcada como BARRICADE_SITE" % site.site_id)
	for site in fixed_sites:
		if site == null or String(site.site_id).is_empty() or site.cells.is_empty():
			errors.append("há um ponto fixo sem ID ou células")
			continue
		for cell in site.cells:
			if cell_type_at(cell) != CellType.FIXED_SITE:
				errors.append("célula de %s não está marcada como FIXED_SITE" % site.site_id)
	return errors


func _point_is_on_path(point: Vector2, tolerance_px: float = 1.0) -> bool:
	for index in range(path_points.size() - 1):
		var start := path_points[index]
		var segment := path_points[index + 1] - start
		var length_squared := segment.length_squared()
		if length_squared <= 0.0:
			continue
		var weight := clampf((point - start).dot(segment) / length_squared, 0.0, 1.0)
		if point.distance_to(start + segment * weight) <= tolerance_px:
			return true
	return false


func _same_cells(first: Array[Vector2i], second: Array[Vector2i]) -> bool:
	if first.size() != second.size():
		return false
	for cell in first:
		if not second.has(cell):
			return false
	return true

