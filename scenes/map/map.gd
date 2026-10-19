class_name MapScene
extends Node2D

@export var map_definition: MapDefinition
@export var shooter_definition: StructureDefinition
@export var barricade_definition: StructureDefinition

@onready var game_manager: GameManager = $GameManager
@onready var wave_manager: WaveManager = $WaveManager
@onready var placement_manager: PlacementManager = $PlacementManager
@onready var enemy_path: Path2D = $EnemyPath

# Visual textures
const TEX_GROUND := preload("res://assets/sprites/tilesets/tile_ground_caatinga.png")
const TEX_ROAD := preload("res://assets/sprites/tilesets/tile_road_dirt.png")
const TEX_CHURCH := preload("res://assets/sprites/props/objective_church_canudos.png")
const TEX_CACTUS := preload("res://assets/sprites/props/prop_cactus_mandacaru.png")

# Cactus decorative placement positions (in grid cells)
const CACTUS_CELLS: Array[Vector2i] = [
	Vector2i(1, 6),
	Vector2i(18, 2),
	Vector2i(7, 9),
	Vector2i(12, 1),
	Vector2i(18, 9)
]

var active_build_definition: StructureDefinition = null
var current_hover_cell: Vector2i = Vector2i(-1, -1)
var hover_is_valid: bool = false

# UI references
@onready var lbl_phase: Label = $UI/PanelTop/HBox/LabelPhase
@onready var lbl_health: Label = $UI/PanelTop/HBox/LabelHealth
@onready var lbl_materials: Label = $UI/PanelTop/HBox/LabelMaterials
@onready var lbl_enemies: Label = $UI/PanelTop/HBox/LabelEnemies
@onready var btn_wave: Button = $UI/PanelTop/HBox/BtnStartWave
@onready var btn_restart: Button = $UI/PanelTop/HBox/BtnRestart
@onready var btn_sniper: Button = $UI/PanelBottom/HBox/BtnBuildSniper
@onready var btn_barricade: Button = $UI/PanelBottom/HBox/BtnBuildBarricade
@onready var lbl_status: Label = $UI/PanelBottom/HBox/LabelStatus


func _ready() -> void:
	if map_definition == null:
		push_error("MapScene requer map_definition atribuído!")
		return

	# Wire GameManager signals
	game_manager.phase_changed.connect(_on_phase_changed)
	game_manager.objective_health_changed.connect(_on_health_changed)
	game_manager.materials_changed.connect(_on_materials_changed)
	game_manager.enemies_alive_changed.connect(_on_enemies_changed)
	game_manager.run_finished.connect(_on_run_finished)

	# Wire UI Buttons
	btn_wave.pressed.connect(_on_start_wave_pressed)
	btn_restart.pressed.connect(_on_restart_pressed)
	btn_sniper.pressed.connect(_on_select_sniper_pressed)
	btn_barricade.pressed.connect(_on_select_barricade_pressed)

	# Nome e custo vêm das definições, para o botão nunca divergir do valor cobrado
	btn_sniper.text = " %s (%d M) " % [shooter_definition.display_name, shooter_definition.cost_materials]
	btn_barricade.text = " %s (%d M) " % [barricade_definition.display_name, barricade_definition.cost_materials]

	_update_hud()
	queue_redraw()


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		var cell := _screen_to_cell(event.position)
		if cell != current_hover_cell:
			current_hover_cell = cell
			if active_build_definition != null:
				var status := placement_manager.preview_at(active_build_definition, current_hover_cell)
				hover_is_valid = status["valid"]
				lbl_status.text = "Construindo: %s | %s" % [
					active_build_definition.display_name,
					"Válido (Clique para posicionar)" if hover_is_valid else status["reason"]
				]
			else:
				hover_is_valid = false
			queue_redraw()

	elif event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_LEFT:
			if active_build_definition != null:
				var cell := _screen_to_cell(event.position)
				var placed := placement_manager.place_structure(active_build_definition, cell)
				if placed != null:
					lbl_status.text = "%s posicionado com sucesso!" % active_build_definition.display_name
					active_build_definition = null
					queue_redraw()
				else:
					var status := placement_manager.placement_status(active_build_definition, cell)
					lbl_status.text = "Não é possível posicionar: %s" % status["reason"]
		elif event.button_index == MOUSE_BUTTON_RIGHT:
			active_build_definition = null
			lbl_status.text = "Seleção cancelada."
			queue_redraw()


func _draw() -> void:
	if map_definition == null:
		return

	var cell_size := float(map_definition.cell_size_px)
	var sz := Vector2(cell_size, cell_size)

	# 1. Desenhar grid e terreno base (Caatinga e Estrada)
	for y in range(map_definition.grid_size.y):
		for x in range(map_definition.grid_size.x):
			var cell := Vector2i(x, y)
			var pos := Vector2(x * cell_size, y * cell_size)
			var c_type := map_definition.cell_type_at(cell)

			if c_type == MapDefinition.CellType.PATH or c_type == MapDefinition.CellType.SPAWN:
				draw_texture_rect(TEX_ROAD, Rect2(pos, sz), false)
			else:
				draw_texture_rect(TEX_GROUND, Rect2(pos, sz), false)

			# Realces visuais dos pontos táticos
			if c_type == MapDefinition.CellType.BARRICADE_SITE:
				draw_rect(Rect2(pos, sz), Color(0.9, 0.6, 0.2, 0.25), true)
				draw_rect(Rect2(pos, sz), Color(0.8, 0.5, 0.1, 0.8), false, 2.0)
			elif c_type == MapDefinition.CellType.FIXED_SITE:
				draw_rect(Rect2(pos, sz), Color(0.2, 0.7, 0.9, 0.25), true)
				draw_rect(Rect2(pos, sz), Color(0.1, 0.6, 0.9, 0.8), false, 2.0)
			elif c_type == MapDefinition.CellType.SPAWN:
				draw_rect(Rect2(pos, sz), Color(0.9, 0.2, 0.2, 0.2), true)

	# 2. Desenhar props de Mandacaru
	for c_pos in CACTUS_CELLS:
		var cactus_rect := Rect2(
			Vector2((c_pos.x - 0.5) * cell_size, (c_pos.y - 1.0) * cell_size),
			Vector2(cell_size * 2.0, cell_size * 2.0)
		)
		draw_texture_rect(TEX_CACTUS, cactus_rect, false)

	# 3. Desenhar a Igreja de Canudos (Objetivo Principal)
	# Células de (14,9) a (17,10) -> Centro do objetivo
	var church_pos := Vector2(13.5 * cell_size, 8.0 * cell_size)
	var church_size := Vector2(cell_size * 4.5, cell_size * 3.5)
	draw_texture_rect(TEX_CHURCH, Rect2(church_pos, church_size), false)

	# 4. Desenhar prévia de posicionamento do mouse
	if active_build_definition != null and map_definition.is_in_bounds(current_hover_cell):
		var site := placement_manager._find_matching_site(active_build_definition, current_hover_cell)
		var cells := placement_manager._cells_for_placement(active_build_definition, current_hover_cell, site)
		var preview_color := Color(0.2, 0.9, 0.3, 0.4) if hover_is_valid else Color(0.9, 0.2, 0.2, 0.4)
		var border_color := Color(0.1, 1.0, 0.2, 0.9) if hover_is_valid else Color(1.0, 0.1, 0.1, 0.9)

		for c in cells:
			if map_definition.is_in_bounds(c):
				var p := Vector2(c.x * cell_size, c.y * cell_size)
				draw_rect(Rect2(p, sz), preview_color, true)
				draw_rect(Rect2(p, sz), border_color, false, 2.0)


func _screen_to_cell(pos: Vector2) -> Vector2i:
	var cs := map_definition.cell_size_px
	return Vector2i(int(pos.x / cs), int(pos.y / cs))


func _update_hud() -> void:
	lbl_health.text = "Igreja: %d/%d HP" % [game_manager.objective_health, game_manager.objective_max_health]
	lbl_materials.text = "Materiais: %d" % game_manager.materials
	lbl_enemies.text = "Inimigos: %d" % game_manager.enemies_alive

	match game_manager.phase:
		GameManager.Phase.PREPARATION:
			lbl_phase.text = "Fase: PREPARAÇÃO"
			lbl_phase.modulate = Color(0.3, 0.9, 0.3)
			btn_wave.disabled = false
		GameManager.Phase.WAVE_ACTIVE:
			lbl_phase.text = "Fase: ONDA EM ANDAMENTO"
			lbl_phase.modulate = Color(0.9, 0.8, 0.2)
			btn_wave.disabled = true
		GameManager.Phase.VICTORY:
			lbl_phase.text = "Fase: VITÓRIA EM CANUDOS!"
			lbl_phase.modulate = Color(0.2, 0.9, 1.0)
			btn_wave.disabled = true
		GameManager.Phase.DEFEAT:
			lbl_phase.text = "Fase: DERROTA"
			lbl_phase.modulate = Color(1.0, 0.2, 0.2)
			btn_wave.disabled = true

	btn_restart.visible = game_manager.phase == GameManager.Phase.VICTORY or game_manager.phase == GameManager.Phase.DEFEAT


func _on_start_wave_pressed() -> void:
	active_build_definition = null
	if wave_manager.start_wave():
		lbl_status.text = "Onda iniciada! O Exército Republicano avança pela caatinga."
	else:
		lbl_status.text = "Não foi possível iniciar a onda."


func _on_restart_pressed() -> void:
	active_build_definition = null
	game_manager.reset_run()
	lbl_status.text = "Nova tentativa. Selecione uma estrutura para construir ou inicie o combate."
	queue_redraw()


func _on_select_sniper_pressed() -> void:
	active_build_definition = shooter_definition
	lbl_status.text = "Modo Construção: %s (Custo: %d). Clique em um ponto livre ou plataforma de pedra [F]." % [active_build_definition.display_name, active_build_definition.cost_materials]
	queue_redraw()


func _on_select_barricade_pressed() -> void:
	active_build_definition = barricade_definition
	lbl_status.text = "Modo Construção: %s (Custo: %d). Clique nas posições reservadas [B1, B2, B3]." % [active_build_definition.display_name, active_build_definition.cost_materials]
	queue_redraw()


func _on_phase_changed(_new_phase: GameManager.Phase) -> void:
	_update_hud()


func _on_health_changed(_cur: int, _max: int) -> void:
	_update_hud()


func _on_materials_changed(_cur: int) -> void:
	_update_hud()


func _on_enemies_changed(_cur: int) -> void:
	_update_hud()


func _on_run_finished(won: bool) -> void:
	_update_hud()
	if won:
		lbl_status.text = "VITÓRIA! O Arraial de Canudos resistiu à primeira expedição!"
	else:
		lbl_status.text = "DERROTA! A Igreja de Bom Jesus foi tomada pelas forças republicanas."
