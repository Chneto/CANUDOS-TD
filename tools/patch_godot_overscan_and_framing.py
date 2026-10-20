import os

print("=== Patching scenes/map/map.gd for Overscan & Camera Pan/Framing ===")

MAP_GD_PATH = "scenes/map/map.gd"
with open(MAP_GD_PATH, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Add right pan tracking variables
OLD_VARS = """var _middle_dragging: bool = false
var _last_drag_pos: Vector2 = Vector2.ZERO"""

NEW_VARS = """var _middle_dragging: bool = false
var _last_drag_pos: Vector2 = Vector2.ZERO
var _is_right_panning: bool = false
var _right_pan_start: Vector2 = Vector2.ZERO
var _right_pan_moved: bool = false"""

if OLD_VARS in code:
    code = code.replace(OLD_VARS, NEW_VARS)
    print("Added right pan variables")

# 2. Add ground overscan fill in _draw()
OLD_DRAW_GROUND = """\t# 1. Desenhar grid e terreno base (Caatinga e Estrada)"""

NEW_DRAW_GROUND = """\t# 0. Fundo infinito de Overscan da Caatinga (elimina qualquer borda/canto cortado ao rotacionar)
\tdraw_rect(Rect2(-1200, -1200, 3680, 3104), Color(0.72, 0.54, 0.33), true)

\t# 1. Desenhar grid e terreno base (Caatinga e Estrada)"""

if OLD_DRAW_GROUND in code:
    code = code.replace(OLD_DRAW_GROUND, NEW_DRAW_GROUND)
    print("Added ground overscan rect")

# 3. Add right-drag pan handling in _unhandled_input
OLD_INPUT_MOUSE = """\telif event is InputEventMouseButton and event.pressed:
\t\tif event.button_index == MOUSE_BUTTON_LEFT:
\t\t\tvar cell := _screen_to_cell(event.position)
\t\t\tif active_build_definition != null:
\t\t\t\tvar placed := placement_manager.place_structure(active_build_definition, cell)
\t\t\t\tif placed != null:
\t\t\t\t\tlbl_status.text = "%s posicionado com sucesso!" % active_build_definition.display_name
\t\t\t\t\tactive_build_definition = null
\t\t\t\t\tqueue_redraw()
\t\t\t\telse:
\t\t\t\t\tvar status := placement_manager.placement_status(active_build_definition, cell)
\t\t\t\t\tlbl_status.text = "Não é possível posicionar: %s" % status["reason"]
\t\t\telif champion_selected:
\t\t\t\tif champion != null and champion.move_to_cell(cell):
\t\t\t\t\tlbl_status.text = "Antônio Conselheiro caminha para a célula %s..." % [cell]
\t\t\t\t\tchampion_selected = false
\t\t\t\t\tqueue_redraw()
\t\t\t\telse:
\t\t\t\t\tlbl_status.text = "Destino inválido: o Conselheiro só anda fora da estrada e dentro do mapa."
\t\telif event.button_index == MOUSE_BUTTON_RIGHT:
\t\t\tactive_build_definition = null
\t\t\tchampion_selected = false
\t\t\tlbl_status.text = "Seleção cancelada."
\t\t\tqueue_redraw()"""

NEW_INPUT_MOUSE = """\telif event is InputEventMouseButton:
\t\tif event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
\t\t\tvar cell := _screen_to_cell(event.position)
\t\t\tif active_build_definition != null:
\t\t\t\tvar placed := placement_manager.place_structure(active_build_definition, cell)
\t\t\t\tif placed != null:
\t\t\t\t\tlbl_status.text = "%s posicionado com sucesso!" % active_build_definition.display_name
\t\t\t\t\tactive_build_definition = null
\t\t\t\t\tqueue_redraw()
\t\t\t\telse:
\t\t\t\t\tvar status := placement_manager.placement_status(active_build_definition, cell)
\t\t\t\t\tlbl_status.text = "Não é possível posicionar: %s" % status["reason"]
\t\t\telif champion_selected:
\t\t\t\tif champion != null and champion.move_to_cell(cell):
\t\t\t\t\tlbl_status.text = "Antônio Conselheiro caminha para a célula %s..." % [cell]
\t\t\t\t\tchampion_selected = false
\t\t\t\t\tqueue_redraw()
\t\t\t\telse:
\t\t\t\t\tlbl_status.text = "Destino inválido: o Conselheiro só anda fora da estrada e dentro do mapa."
\t\telif event.button_index == MOUSE_BUTTON_RIGHT:
\t\t\tif event.pressed:
\t\t\t\t_is_right_panning = true
\t\t\t\t_right_pan_start = event.position
\t\t\t\t_right_pan_moved = false
\t\t\telse:
\t\t\t\t_is_right_panning = false
\t\t\t\tif not _right_pan_moved:
\t\t\t\t\tactive_build_definition = null
\t\t\t\t\tchampion_selected = false
\t\t\t\t\tlbl_status.text = "Seleção cancelada."
\t\t\t\t\tqueue_redraw()"""

if OLD_INPUT_MOUSE in code:
    code = code.replace(OLD_INPUT_MOUSE, NEW_INPUT_MOUSE)
    print("Updated mouse input with right pan detection")

# Add right drag motion
OLD_MOTION = """\telif event is InputEventMouseMotion and _middle_dragging:
\t\tvar delta_x: float = event.position.x - _last_drag_pos.x
\t\tif camera_pivot != null:
\t\t\t# Rotação orbital cônica/funil: amplitude limitada (-36° a +36°) para que o mundo NUNCA fique de cabeça para baixo
\t\t\tcamera_pivot.rotation = clampf(camera_pivot.rotation + delta_x * 0.0035, -0.628, 0.628)
\t\t\tif btn_camera:
\t\t\t\tbtn_camera.text = " 📷 Câmera (%.0f°) " % rad_to_deg(camera_pivot.rotation)
\t\t_last_drag_pos = event.position
\t\tqueue_redraw()"""

NEW_MOTION = """\telif event is InputEventMouseMotion and _middle_dragging:
\t\tvar delta_x: float = event.position.x - _last_drag_pos.x
\t\tif camera_pivot != null:
\t\t\t# Rotação orbital cônica/funil: amplitude limitada (-36° a +36°) para que o mundo NUNCA fique de cabeça para baixo
\t\t\tcamera_pivot.rotation = clampf(camera_pivot.rotation + delta_x * 0.0035, -0.628, 0.628)
\t\t\tif btn_camera:
\t\t\t\tbtn_camera.text = " 📷 Câmera (%.0f°) " % rad_to_deg(camera_pivot.rotation)
\t\t_last_drag_pos = event.position
\t\tqueue_redraw()

\telif event is InputEventMouseMotion and _is_right_panning:
\t\tvar delta: Vector2 = event.position - _right_pan_start
\t\tif delta.length() > 3.0:
\t\t\t_right_pan_moved = true
\t\tif camera_pivot != null:
\t\t\tcamera_pivot.position -= delta * (1.0 / (camera.zoom.x if camera != null else 1.0))
\t\t_right_pan_start = event.position
\t\tqueue_redraw()"""

if OLD_MOTION in code:
    code = code.replace(OLD_MOTION, NEW_MOTION)
    print("Updated mouse motion with right pan")

# Add focar_setor function and keys J, K, L
OLD_RESET = """func _reset_camera() -> void:
\tis_camera_aligned = false
\tif camera_pivot != null:
\t\tcamera_pivot.rotation = 0.0
\tif camera != null:
\t\tcamera.zoom = Vector2(1.0, 1.0)
\tif btn_camera != null:
\t\tbtn_camera.text = " 📷 Câmera (0°) " """

NEW_RESET = """func focar_setor(setor_nome: String) -> void:
\tif camera_pivot == null or camera == null:
\t\treturn
\tvar tw := create_tween().set_parallel(true)
\tif setor_nome == "geral":
\t\ttw.tween_property(camera_pivot, "position", Vector2(640, 352), 0.35).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
\t\ttw.tween_property(camera_pivot, "rotation", 0.0, 0.35)
\t\ttw.tween_property(camera, "zoom", Vector2(1.0, 1.0), 0.35)
\t\tis_camera_aligned = false
\t\tif btn_camera: btn_camera.text = " 📷 Câmera (0°) "
\telif setor_nome == "entrada":
\t\ttw.tween_property(camera_pivot, "position", Vector2(300, 200), 0.35).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
\t\ttw.tween_property(camera_pivot, "rotation", -0.15, 0.35)
\t\ttw.tween_property(camera, "zoom", Vector2(1.25, 1.25), 0.35)
\t\tif btn_camera: btn_camera.text = " 📷 1. Entrada "
\telif setor_nome == "reta":
\t\ttw.tween_property(camera_pivot, "position", Vector2(640, 352), 0.35).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
\t\ttw.tween_property(camera_pivot, "rotation", ALIGNED_CAMERA_ANGLE, 0.35)
\t\ttw.tween_property(camera, "zoom", Vector2(1.30, 1.30), 0.35)
\t\tis_camera_aligned = true
\t\tif btn_camera: btn_camera.text = " 📷 2. Reta Central "
\telif setor_nome == "igreja":
\t\ttw.tween_property(camera_pivot, "position", Vector2(980, 480), 0.35).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
\t\ttw.tween_property(camera_pivot, "rotation", 0.0, 0.35)
\t\ttw.tween_property(camera, "zoom", Vector2(1.30, 1.30), 0.35)
\t\tif btn_camera: btn_camera.text = " 📷 3. Igreja "
\tqueue_redraw()

func _reset_camera() -> void:
\tfocar_setor("geral")"""

if OLD_RESET in code:
    code = code.replace(OLD_RESET, NEW_RESET)
    print("Added focar_setor and updated reset")

# Add shortcut keys in keydown
OLD_KEYS = """\t\telif event.keycode == KEY_R:
\t\t\t_reset_camera()"""

NEW_KEYS = """\t\telif event.keycode == KEY_R:
\t\t\tfocar_setor("geral")
\t\telif event.keycode == KEY_J:
\t\t\tfocar_setor("entrada")
\t\telif event.keycode == KEY_K:
\t\t\tfocar_setor("reta")
\t\telif event.keycode == KEY_L:
\t\t\tfocar_setor("igreja")"""

if OLD_KEYS in code:
    code = code.replace(OLD_KEYS, NEW_KEYS)
    print("Added J, K, L shortcut keys")

with open(MAP_GD_PATH, "w", encoding="utf-8") as f:
    f.write(code)
print("scenes/map/map.gd patched successfully.")
