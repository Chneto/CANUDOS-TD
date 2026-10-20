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
const TEX_LAJEDO := preload("res://assets/sprites/props/prop_rock_lajedo.png")
const TEX_JUAZEIRO := preload("res://assets/sprites/props/prop_tree_juazeiro.png")
const TEX_HOUSE := preload("res://assets/sprites/props/prop_house_taipa.png")
const TEX_SNIPER := preload("res://assets/sprites/towers/tower_sniper_jagunco.png")
const TEX_BARRICADE := preload("res://assets/sprites/towers/tower_barricade_taipa.png")

# Cactus decorative placement positions (in grid cells)
const CACTUS_CELLS: Array[Vector2i] = [
	Vector2i(1, 6),
	Vector2i(18, 2),
	Vector2i(7, 9),
	Vector2i(12, 1),
	Vector2i(18, 9)
]

# Juazeiro / Umbuzeiro (Mata Branca)
const JUAZEIRO_CELLS: Array[Vector2i] = [
	Vector2i(3, 4),
	Vector2i(9, 1),
	Vector2i(2, 9)
]

# Casebres de Taipa ao redor do Arraial
const HOUSE_CELLS: Array[Vector2i] = [
	Vector2i(13, 7),
	Vector2i(17, 7),
	Vector2i(18, 5)
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
@onready var btn_camera: Button = $UI/PanelTop/HBox/BtnCamera
@onready var btn_restart: Button = $UI/PanelTop/HBox/BtnRestart
@onready var slider_volume: HSlider = $UI/PanelTop/HBox/SliderVolume
@onready var music_player: AudioStreamPlayer = $MusicPlayer

# SFX Players
@onready var sfx_musket: AudioStreamPlayer = $SFXMusket
@onready var sfx_impact: AudioStreamPlayer = $SFXImpact
@onready var sfx_horn: AudioStreamPlayer = $SFXWaveHorn
@onready var sfx_mutirao: AudioStreamPlayer = $SFXMutirao
@onready var sfx_predica: AudioStreamPlayer = $SFXPredica
@onready var sfx_victory: AudioStreamPlayer = $SFXVictory
@onready var sfx_defeat: AudioStreamPlayer = $SFXDefeat

# Bottom HUD references
@onready var btn_sniper: Button = $UI/PanelBottom/HBox/BtnBuildSniper
@onready var btn_barricade: Button = $UI/PanelBottom/HBox/BtnBuildBarricade
@onready var btn_champion: Button = $UI/PanelBottom/HBox/BtnChampion
@onready var btn_mutirao: Button = $UI/PanelBottom/HBox/BtnMutirao
@onready var btn_predica: Button = $UI/PanelBottom/HBox/BtnPredica
@onready var lbl_status: Label = $UI/PanelBottom/HBox/LabelStatus
@onready var champion: ChampionConselheiro = $ChampionConselheiro

# Camera references and states
@onready var camera_pivot: Node2D = $CameraPivot
@onready var camera: Camera2D = $CameraPivot/Camera2D
const ALIGNED_CAMERA_ANGLE: float = -0.4636476 # -26.565 graus alinhado à trajetória retangular
var is_camera_aligned: bool = false
var _middle_dragging: bool = false
var _last_drag_pos: Vector2 = Vector2.ZERO
var _is_right_panning: bool = false
var _right_pan_start: Vector2 = Vector2.ZERO
var _right_pan_moved: bool = false
var _shake_timer: float = 0.0
var _shake_strength: float = 0.0

var champion_selected: bool = false


func _ready() -> void:
	if map_definition == null:
		push_error("MapScene requer map_definition atribuído!")
		return

	if champion != null:
		if champion.map_definition == null:
			champion.map_definition = map_definition
		if champion.game_manager == null:
			champion.game_manager = game_manager

	# Wire GameManager signals
	game_manager.phase_changed.connect(_on_phase_changed)
	game_manager.objective_health_changed.connect(_on_health_changed)
	game_manager.materials_changed.connect(_on_materials_changed)
	game_manager.enemies_alive_changed.connect(_on_enemies_changed)
	game_manager.run_finished.connect(_on_run_finished)

	# Wire WaveManager signals
	wave_manager.enemy_spawned.connect(_on_enemy_spawned)

	# Wire PlacementManager structure placed
	placement_manager.structure_placed.connect(_on_structure_placed)

	# Wire UI Buttons
	btn_wave.pressed.connect(_on_start_wave_pressed)
	btn_restart.pressed.connect(_on_restart_pressed)
	btn_sniper.pressed.connect(_on_select_sniper_pressed)
	btn_barricade.pressed.connect(_on_select_barricade_pressed)
	if btn_camera:
		btn_camera.pressed.connect(_on_camera_pressed)
	if btn_champion:
		btn_champion.pressed.connect(_on_select_champion_pressed)
	if btn_mutirao:
		btn_mutirao.pressed.connect(_on_use_mutirao_pressed)
	if btn_predica:
		btn_predica.pressed.connect(_on_use_predica_pressed)
	if slider_volume:
		slider_volume.value_changed.connect(_on_volume_changed)

	# Nome e custo vêm das definições, para o botão nunca divergir do valor cobrado
	btn_sniper.text = " %s (%d M) " % [shooter_definition.display_name, shooter_definition.cost_materials]
	btn_barricade.text = " %s (%d M) " % [barricade_definition.display_name, barricade_definition.cost_materials]

	_update_hud()
	queue_redraw()


func _process(delta: float) -> void:
	# Atualiza a prévia de alcance e barras de vida durante a onda
	if game_manager.phase == GameManager.Phase.WAVE_ACTIVE:
		queue_redraw()

	# Atualiza o hover e a prévia fantasma da torre a 60 FPS quando em modo construção
	if active_build_definition != null and DisplayServer.get_name() != "headless":
		var mouse_cell := _screen_to_cell(get_global_mouse_position())
		if mouse_cell != current_hover_cell:
			current_hover_cell = mouse_cell
			var status := placement_manager.preview_at(active_build_definition, current_hover_cell)
			hover_is_valid = status["valid"]
			queue_redraw()

	# Processa tremor suave de câmera
	if _shake_timer > 0.0:
		_shake_timer -= delta
		if camera != null:
			var offset := Vector2(randf_range(-1.0, 1.0), randf_range(-1.0, 1.0)) * _shake_strength
			camera.position = Vector2(-640, -352) + offset
		if _shake_timer <= 0.0 and camera != null:
			camera.position = Vector2(-640, -352)

	# Atualiza rótulos e estado das habilidades do Conselheiro
	if champion != null:
		if btn_mutirao != null:
			if champion.mutirao_cd_timer > 0.0:
				btn_mutirao.text = " [Q] Mutirão (%.0fs) " % champion.mutirao_cd_timer
				btn_mutirao.disabled = true
			else:
				btn_mutirao.text = " [Q] Mutirão "
				btn_mutirao.disabled = false

		if btn_predica != null:
			if champion.predica_active_timer > 0.0:
				btn_predica.text = " [W] Prédica (%.0fs) " % champion.predica_active_timer
				btn_predica.disabled = true
			elif champion.predica_cd_timer > 0.0:
				btn_predica.text = " [W] Prédica (%.0fs) " % champion.predica_cd_timer
				btn_predica.disabled = true
			else:
				btn_predica.text = " [W] Prédica "
				btn_predica.disabled = game_manager.phase != GameManager.Phase.WAVE_ACTIVE


func _unhandled_input(event: InputEvent) -> void:
	# 1. Rotação e Zoom de Câmera interativos
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_MIDDLE:
			_middle_dragging = event.pressed
			_last_drag_pos = event.position
		elif event.button_index == MOUSE_BUTTON_WHEEL_UP and event.pressed:
			_zoom_camera(1.08)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN and event.pressed:
			_zoom_camera(0.92)

	elif event is InputEventMouseMotion and _middle_dragging:
		var delta_x: float = event.position.x - _last_drag_pos.x
		var delta_y: float = event.position.y - _last_drag_pos.y
		if camera_pivot != null:
			# Rotação orbital cônica/funil: amplitude limitada (-36° a +36°) para que o mundo NUNCA fique de cabeça para baixo
			camera_pivot.rotation = clampf(camera_pivot.rotation + delta_x * 0.0035, -0.628, 0.628)
			# Inclinação vertical de profundidade (pitch): 20° a 75°
			camera_pivot.scale.y = clampf(camera_pivot.scale.y - delta_y * 0.0035, 0.45, 1.35)
			if btn_camera:
				var pitch_deg := roundf(20.0 + ((camera_pivot.scale.y - 0.45) / (1.35 - 0.45)) * 55.0)
				btn_camera.text = " 📷 Giro %.0f° · Prof %.0f° " % [rad_to_deg(camera_pivot.rotation), pitch_deg]
		_last_drag_pos = event.position
		queue_redraw()

	elif event is InputEventMouseMotion and _is_right_panning:
		var delta: Vector2 = event.position - _right_pan_start
		if delta.length() > 3.0:
			_right_pan_moved = true
		if camera_pivot != null:
			camera_pivot.position -= delta * (1.0 / (camera.zoom.x if camera != null else 1.0))
		_right_pan_start = event.position
		queue_redraw()

	# 2. Hover e Posicionamento
	if event is InputEventMouseMotion and not _middle_dragging:
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
			elif champion_selected:
				hover_is_valid = map_definition.is_inside_grid(current_hover_cell) and not map_definition.is_road(current_hover_cell)
				lbl_status.text = "Mover Conselheiro para %s: %s" % [
					current_hover_cell,
					"Válido" if hover_is_valid else "Não pode andar na estrada"
				]
			else:
				hover_is_valid = false
			queue_redraw()

	elif event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
			var cell := _screen_to_cell(event.position)
			if active_build_definition != null:
				var placed := placement_manager.place_structure(active_build_definition, cell)
				if placed != null:
					lbl_status.text = "%s posicionado com sucesso!" % active_build_definition.display_name
					active_build_definition = null
					queue_redraw()
				else:
					var status := placement_manager.placement_status(active_build_definition, cell)
					lbl_status.text = "Não é possível posicionar: %s" % status["reason"]
			elif champion_selected:
				if champion != null and champion.move_to_cell(cell):
					lbl_status.text = "Antônio Conselheiro caminha para a célula %s..." % [cell]
					champion_selected = false
					queue_redraw()
				else:
					lbl_status.text = "Destino inválido: o Conselheiro só anda fora da estrada e dentro do mapa."
		elif event.button_index == MOUSE_BUTTON_RIGHT:
			if event.pressed:
				_is_right_panning = true
				_right_pan_start = event.position
				_right_pan_moved = false
			else:
				_is_right_panning = false
				if not _right_pan_moved:
					active_build_definition = null
					champion_selected = false
					lbl_status.text = "Seleção cancelada."
					queue_redraw()

	# 3. Atalhos de Teclado
	elif event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_1:
			_on_select_barricade_pressed()
		elif event.keycode == KEY_2:
			_on_select_sniper_pressed()
		elif event.keycode == KEY_3:
			_on_select_champion_pressed()
		elif event.keycode == KEY_Q:
			_on_use_mutirao_pressed()
		elif event.keycode == KEY_W:
			_on_use_predica_pressed()
		elif event.keycode == KEY_C:
			_on_camera_pressed()
		elif event.keycode == KEY_R:
			focar_setor("geral")
		elif event.keycode == KEY_J:
			focar_setor("entrada")
		elif event.keycode == KEY_K:
			focar_setor("reta")
		elif event.keycode == KEY_L:
			focar_setor("igreja")
		elif event.keycode == KEY_ESCAPE:
			active_build_definition = null
			champion_selected = false
			lbl_status.text = "Seleção cancelada."
			queue_redraw()


func _draw() -> void:
	if map_definition == null:
		return

	var cell_size := float(map_definition.cell_size_px)
	var sz := Vector2(cell_size, cell_size)

	# 0. Fundo infinito de Overscan da Caatinga (elimina qualquer borda/canto cortado ao rotacionar)
	draw_rect(Rect2(-1200, -1200, 3680, 3104), Color(0.72, 0.54, 0.33), true)

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
				draw_texture_rect(TEX_LAJEDO, Rect2(pos, sz), false)
				draw_rect(Rect2(pos, sz), Color(0.2, 0.7, 0.9, 0.2), true)
				draw_rect(Rect2(pos, sz), Color(0.1, 0.6, 0.9, 0.8), false, 1.5)
			elif c_type == MapDefinition.CellType.SPAWN:
				draw_rect(Rect2(pos, sz), Color(0.9, 0.2, 0.2, 0.2), true)

	# 2. Desenhar props de Mandacaru
	for c_pos in CACTUS_CELLS:
		var cactus_rect := Rect2(
			Vector2((c_pos.x - 0.5) * cell_size, (c_pos.y - 1.0) * cell_size),
			Vector2(cell_size * 2.0, cell_size * 2.0)
		)
		draw_texture_rect(TEX_CACTUS, cactus_rect, false)

	# 3. Desenhar árvores de Juazeiro / Umbuzeiro (Mata Branca)
	for t_pos in JUAZEIRO_CELLS:
		var tree_rect := Rect2(
			Vector2((t_pos.x - 0.75) * cell_size, (t_pos.y - 1.5) * cell_size),
			Vector2(cell_size * 2.5, cell_size * 2.5)
		)
		draw_texture_rect(TEX_JUAZEIRO, tree_rect, false)

	# 4. Desenhar Casebres de Taipa (Arraial de Canudos)
	for h_pos in HOUSE_CELLS:
		var house_rect := Rect2(
			Vector2((h_pos.x - 0.5) * cell_size, (h_pos.y - 0.8) * cell_size),
			Vector2(cell_size * 2.0, cell_size * 1.8)
		)
		draw_texture_rect(TEX_HOUSE, house_rect, false)

	# 5. Desenhar a Igreja de Canudos (Objetivo Principal)
	var church_pos := Vector2(13.5 * cell_size, 8.0 * cell_size)
	var church_size := Vector2(cell_size * 4.5, cell_size * 3.5)
	# Sombra suave da Igreja
	draw_ellipse(church_pos + Vector2(church_size.x * 0.5, church_size.y * 0.9), church_size.x * 0.45, church_size.y * 0.2, Color(0, 0, 0, 0.35))
	draw_texture_rect(TEX_CHURCH, Rect2(church_pos, church_size), false)

	# Barra de vida estilizada flutuando sobre a Igreja
	var ch_bar_pos := Vector2(15.75 * cell_size, 7.8 * cell_size)
	var ch_bar_w := 120.0
	var ch_bar_h := 6.0
	var ch_rect := Rect2(ch_bar_pos.x - ch_bar_w * 0.5, ch_bar_pos.y, ch_bar_w, ch_bar_h)
	var ch_ratio := clampf(float(game_manager.objective_health) / float(game_manager.objective_max_health), 0.0, 1.0)
	var ch_color := Color(0.2, 0.85, 0.3) if ch_ratio > 0.5 else Color(0.9, 0.7, 0.1) if ch_ratio > 0.25 else Color(0.9, 0.2, 0.2)
	draw_rect(ch_rect, Color(0.1, 0.08, 0.06, 0.85), true)
	draw_rect(Rect2(ch_rect.position, Vector2(ch_bar_w * ch_ratio, ch_bar_h)), ch_color, true)
	draw_rect(ch_rect, Color(0.6, 0.45, 0.25, 0.8), false, 1.0)

	# 6. Indicador de alcance das torres posicionadas e sombras de base
	var mouse_pos := get_local_mouse_position()
	for child in placement_manager.get_children():
		if child is DefenseStructure and is_instance_valid(child):
			# Sombra de base sob atirador
			draw_ellipse(child.position + Vector2(0, 4), 22.0, 10.0, Color(0, 0, 0, 0.28))
			if mouse_pos.distance_to(child.position) < cell_size * 2.0:
				draw_circle(child.position, child.definition.attack_range_px, Color(0.2, 0.7, 1.0, 0.06))
				draw_arc(child.position, child.definition.attack_range_px, 0.0, TAU, 48, Color(0.3, 0.8, 1.0, 0.4), 1.5)

		# Barra de vida e sombra das barricadas
		elif child is Barricade and is_instance_valid(child) and not child.is_destroyed():
			draw_ellipse(child.position + Vector2(0, 8), 26.0, 12.0, Color(0, 0, 0, 0.32))
			if child.health < child.definition.max_health:
				var bar_w := 48.0
				var bar_h := 4.0
				var b_rect := Rect2(child.position.x - bar_w * 0.5, child.position.y - 32.0, bar_w, bar_h)
				var b_ratio := clampf(child.health / child.definition.max_health, 0.0, 1.0)
				draw_rect(b_rect, Color(0.1, 0.08, 0.06, 0.8), true)
				draw_rect(Rect2(b_rect.position, Vector2(bar_w * b_ratio, bar_h)), Color(0.2, 0.85, 0.3), true)
				draw_rect(b_rect, Color(0.5, 0.35, 0.2), false, 1.0)

	# 7. Desenhar prévia de posicionamento do mouse e círculo de alcance
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

		# Círculo de alcance do atirador durante a prévia de construção
		if active_build_definition.kind == StructureDefinition.Kind.SHOOTER:
			var center_preview := (Vector2(current_hover_cell) + Vector2(1.0, 0.5)) * cell_size
			var range_color := Color(0.2, 0.85, 1.0, 0.8) if hover_is_valid else Color(1.0, 0.3, 0.3, 0.6)
			var fill_color := Color(0.2, 0.85, 1.0, 0.12) if hover_is_valid else Color(1.0, 0.3, 0.3, 0.06)
			draw_circle(center_preview, active_build_definition.attack_range_px, fill_color)
			draw_arc(center_preview, active_build_definition.attack_range_px, 0.0, TAU, 72, range_color, 2.5)
			draw_line(center_preview - Vector2(10, 0), center_preview + Vector2(10, 0), range_color, 1.5)
			draw_line(center_preview - Vector2(0, 10), center_preview + Vector2(0, 10), range_color, 1.5)

			# Fantasma transparente da guarnição de jagunços no mapa
			var spr_w := cell_size * 2.0
			var spr_h := cell_size * 1.5
			var spr_rect := Rect2(current_hover_cell.x * cell_size, (current_hover_cell.y - 0.5) * cell_size, spr_w, spr_h)
			var spr_mod := Color(1.0, 1.0, 1.0, 0.7) if hover_is_valid else Color(1.0, 0.4, 0.4, 0.5)
			draw_texture_rect(TEX_SNIPER, spr_rect, false, spr_mod)

		elif active_build_definition.kind == StructureDefinition.Kind.BARRICADE:
			# Fantasma transparente da barricada de taipa
			var spr_w := cell_size * 2.0
			var spr_h := cell_size * 1.25
			var spr_rect := Rect2(current_hover_cell.x * cell_size, (current_hover_cell.y - 0.25) * cell_size, spr_w, spr_h)
			var spr_mod := Color(1.0, 1.0, 1.0, 0.7) if hover_is_valid else Color(1.0, 0.4, 0.4, 0.5)
			draw_texture_rect(TEX_BARRICADE, spr_rect, false, spr_mod)


func _screen_to_cell(pos: Vector2) -> Vector2i:
	if map_definition == null:
		return Vector2i(-1, -1)
	var cs := float(map_definition.cell_size_px)
	var p := pos
	if DisplayServer.get_name() != "headless":
		p = get_global_mouse_position()
	return Vector2i(int(floor(p.x / cs)), int(floor(p.y / cs)))


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


func _on_structure_placed(structure: Node2D, _def: StructureDefinition, _cells: Array[Vector2i]) -> void:
	if structure is DefenseStructure:
		structure.attack_fired.connect(_on_defense_attack_fired.bind(structure))
	elif structure is Barricade:
		structure.damaged.connect(_on_barricade_damaged.bind(structure))


func _on_defense_attack_fired(target: Enemy, shooter: DefenseStructure) -> void:
	if not is_instance_valid(shooter) or not is_instance_valid(target):
		return
	_play_sfx(sfx_musket)
	_spawn_muzzle_and_tracer(shooter.global_position + Vector2(0, -28), target.global_position + Vector2(0, -24))


func _on_barricade_damaged(amount: float, barricade: Barricade) -> void:
	if not is_instance_valid(barricade):
		return
	_play_sfx(sfx_impact)
	_shake_camera(2.5, 0.12)
	_spawn_floating_text(barricade.global_position + Vector2(0, -24), "-%.0f HP" % amount, Color(1.0, 0.65, 0.3))


func _on_enemy_spawned(enemy: Enemy) -> void:
	if is_instance_valid(enemy):
		enemy.damaged.connect(_on_enemy_damaged.bind(enemy))


func _on_enemy_damaged(amount: float, enemy: Enemy) -> void:
	if is_instance_valid(enemy):
		_spawn_floating_text(enemy.global_position + Vector2(0, -32), "-%.0f" % amount, Color(1.0, 0.3, 0.25))


func _spawn_floating_text(world_pos: Vector2, text: String, color: Color) -> void:
	var label := Label.new()
	label.text = text
	label.position = world_pos + Vector2(-20, -10)
	label.modulate = color
	label.add_theme_font_size_override("font_size", 13)
	add_child(label)

	var tw := create_tween()
	tw.parallel().tween_property(label, "position:y", world_pos.y - 32.0, 0.55).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	tw.parallel().tween_property(label, "modulate:a", 0.0, 0.55).set_delay(0.15)
	tw.tween_callback(label.queue_free)


func _shake_camera(strength: float, duration: float) -> void:
	_shake_strength = strength
	_shake_timer = duration


func _spawn_muzzle_and_tracer(from_pos: Vector2, to_pos: Vector2) -> void:
	# 1. Traçador de tiro de pólvora com fade rápido
	var line := Line2D.new()
	line.width = 2.0
	line.default_color = Color(1.0, 0.85, 0.35, 0.95)
	line.add_point(to_local(from_pos))
	line.add_point(to_local(to_pos))
	add_child(line)

	var tw := create_tween()
	tw.tween_property(line, "modulate:a", 0.0, 0.09)
	tw.tween_callback(line.queue_free)

	# 2. Nuvem de fumaça de pólvora seca no cano da espingarda
	var smoke := CPUParticles2D.new()
	smoke.position = to_local(from_pos)
	smoke.emitting = true
	smoke.one_shot = true
	smoke.explosiveness = 1.0
	smoke.lifetime = 0.35
	smoke.amount = 6
	smoke.direction = (to_pos - from_pos).normalized()
	smoke.spread = 30.0
	smoke.gravity = Vector2(0, -15)
	smoke.initial_velocity_min = 20.0
	smoke.initial_velocity_max = 45.0
	smoke.scale_amount_min = 2.0
	smoke.scale_amount_max = 4.5
	smoke.color = Color(0.9, 0.88, 0.82, 0.6)
	add_child(smoke)

	var smoke_tw := create_tween()
	smoke_tw.tween_interval(0.4)
	smoke_tw.tween_callback(smoke.queue_free)


func _on_start_wave_pressed() -> void:
	active_build_definition = null
	if wave_manager.start_wave():
		_play_sfx(sfx_horn)
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
		_play_sfx(sfx_victory)
		lbl_status.text = "VITÓRIA! O Arraial de Canudos resistiu à primeira expedição!"
	else:
		_play_sfx(sfx_defeat)
		lbl_status.text = "DERROTA! A Igreja de Bom Jesus foi tomada pelas forças republicanas."


func _on_camera_pressed() -> void:
	var cur_rot := camera_pivot.rotation if camera_pivot != null else 0.0
	var target_rot := 0.0
	if absf(cur_rot) < 0.08:
		target_rot = ALIGNED_CAMERA_ANGLE # -26.565 graus
		lbl_status.text = "Câmera alinhada perpendicular à marcha dos soldados (-26,5°)."
	elif cur_rot < -0.2:
		target_rot = -ALIGNED_CAMERA_ANGLE # +26.565 graus (flanco)
		lbl_status.text = "Câmera em vista de flanco (+26,5°)."
	else:
		target_rot = 0.0
		lbl_status.text = "Câmera em vista frontal padrão (0°)."

	if camera_pivot != null:
		var tw := create_tween()
		tw.tween_property(camera_pivot, "rotation", target_rot, 0.3).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	if btn_camera != null:
		btn_camera.text = " 📷 Câmera (%.0f°) " % rad_to_deg(target_rot)
	queue_redraw()


func focar_setor(setor_nome: String) -> void:
	if camera_pivot == null or camera == null:
		return
	var tw := create_tween().set_parallel(true)
	if setor_nome == "geral":
		tw.tween_property(camera_pivot, "position", Vector2(640, 352), 0.35).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
		tw.tween_property(camera_pivot, "rotation", 0.0, 0.35)
		tw.tween_property(camera, "zoom", Vector2(1.0, 1.0), 0.35)
		is_camera_aligned = false
		if btn_camera: btn_camera.text = " 📷 Câmera (0°) "
	elif setor_nome == "entrada":
		tw.tween_property(camera_pivot, "position", Vector2(300, 200), 0.35).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
		tw.tween_property(camera_pivot, "rotation", -0.15, 0.35)
		tw.tween_property(camera, "zoom", Vector2(1.25, 1.25), 0.35)
		if btn_camera: btn_camera.text = " 📷 1. Entrada "
	elif setor_nome == "reta":
		tw.tween_property(camera_pivot, "position", Vector2(640, 352), 0.35).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
		tw.tween_property(camera_pivot, "rotation", ALIGNED_CAMERA_ANGLE, 0.35)
		tw.tween_property(camera, "zoom", Vector2(1.30, 1.30), 0.35)
		is_camera_aligned = true
		if btn_camera: btn_camera.text = " 📷 2. Reta Central "
	elif setor_nome == "igreja":
		tw.tween_property(camera_pivot, "position", Vector2(980, 480), 0.35).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
		tw.tween_property(camera_pivot, "rotation", 0.0, 0.35)
		tw.tween_property(camera, "zoom", Vector2(1.30, 1.30), 0.35)
		if btn_camera: btn_camera.text = " 📷 3. Igreja "
	queue_redraw()


func _reset_camera() -> void:
	is_camera_aligned = false
	if camera_pivot != null:
		camera_pivot.rotation = 0.0
		camera_pivot.scale = Vector2(1.0, 1.0)
	if camera != null:
		camera.zoom = Vector2(1.0, 1.0)
	if btn_camera != null:
		btn_camera.text = " 📷 Câmera (0°) "
	lbl_status.text = "Câmera restaurada para visão padrão (0°)."
	queue_redraw()


func _zoom_camera(factor: float) -> void:
	if camera != null:
		var new_z := clampf(camera.zoom.x * factor, 0.68, 2.30)
		camera.zoom = Vector2(new_z, new_z)
		queue_redraw()


func _on_volume_changed(val: float) -> void:
	var db := -80.0 if val <= 0.0 else linear_to_db(val / 100.0)
	if music_player:
		music_player.volume_db = db - 4.0
	var sfx_list: Array[AudioStreamPlayer] = [sfx_musket, sfx_impact, sfx_horn, sfx_mutirao, sfx_predica, sfx_victory, sfx_defeat]
	for sfx in sfx_list:
		if sfx != null:
			sfx.volume_db = db


func _play_sfx(player: AudioStreamPlayer) -> void:
	if player != null and is_instance_valid(player) and DisplayServer.get_name() != "headless":
		player.play()


func _on_select_champion_pressed() -> void:
	active_build_definition = null
	champion_selected = true
	lbl_status.text = "Antônio Conselheiro selecionado. Clique em uma casa livre fora da estrada para que ele caminhe até lá."
	queue_redraw()


func _on_use_mutirao_pressed() -> void:
	if champion != null:
		var res := champion.use_mutirao()
		if res["ok"]:
			_play_sfx(sfx_mutirao)
			_spawn_floating_text(champion.global_position + Vector2(0, -40), "+150 HP Mutirão!", Color(0.3, 1.0, 0.4))
			lbl_status.text = "Mutirão concluído! %d barricada(s) reparada(s)." % res["repaired"]
		else:
			lbl_status.text = res["reason"]


func _on_use_predica_pressed() -> void:
	if champion != null:
		var res := champion.use_predica()
		if res["ok"]:
			_play_sfx(sfx_predica)
			_spawn_floating_text(champion.global_position + Vector2(0, -40), "Prédica da Fé (-50% dano)", Color(0.4, 0.8, 1.0))
			lbl_status.text = "Prédica iniciada! Barricadas próximas sofrem metade do dano por %.0fs." % res["duration"]
		else:
			lbl_status.text = res["reason"]
