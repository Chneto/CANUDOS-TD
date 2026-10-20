with open('scenes/map/map.gd', 'r', encoding='utf-8') as f:
    gd_content = f.read()

# 1. Add texture preloads
old_tex = '''const TEX_HOUSE := preload("res://assets/sprites/props/prop_house_taipa.png")'''
new_tex = '''const TEX_HOUSE := preload("res://assets/sprites/props/prop_house_taipa.png")
const TEX_SNIPER := preload("res://assets/sprites/towers/tower_sniper_jagunco.png")
const TEX_BARRICADE := preload("res://assets/sprites/towers/tower_barricade_taipa.png")'''

if old_tex in gd_content:
    gd_content = gd_content.replace(old_tex, new_tex)
    print("Added tower preloads in map.gd")
else:
    print("Warning: old_tex not found")

# 2. Update _process to keep hover and redraw active while in build mode
old_process = '''func _process(delta: float) -> void:
	# Atualiza a prévia de alcance e barras de vida durante a onda
	if game_manager.phase == GameManager.Phase.WAVE_ACTIVE:
		queue_redraw()'''

new_process = '''func _process(delta: float) -> void:
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
			queue_redraw()'''

if old_process in gd_content:
    gd_content = gd_content.replace(old_process, new_process)
    print("Updated _process in map.gd")
else:
    print("Warning: old_process not found")

# 3. Update camera drag in _unhandled_input
old_drag = '''	elif event is InputEventMouseMotion and _middle_dragging:
		var delta_x: float = event.position.x - _last_drag_pos.x
		if camera_pivot != null:
			camera_pivot.rotation += delta_x * 0.005
			if btn_camera:
				btn_camera.text = " 📷 Câmera (%.0f°) " % rad_to_deg(camera_pivot.rotation)
		_last_drag_pos = event.position
		queue_redraw()'''

new_drag = '''	elif event is InputEventMouseMotion and _middle_dragging:
		var delta_x: float = event.position.x - _last_drag_pos.x
		if camera_pivot != null:
			# Rotação orbital cônica/funil: amplitude limitada (-36° a +36°) para que o mundo NUNCA fique de cabeça para baixo
			camera_pivot.rotation = clampf(camera_pivot.rotation + delta_x * 0.0035, -0.628, 0.628)
			if btn_camera:
				btn_camera.text = " 📷 Câmera (%.0f°) " % rad_to_deg(camera_pivot.rotation)
		_last_drag_pos = event.position
		queue_redraw()'''

if old_drag in gd_content:
    gd_content = gd_content.replace(old_drag, new_drag)
    print("Updated camera drag in map.gd")
else:
    print("Warning: old_drag not found")

# 4. Update preview and ghost drawing in _draw()
old_draw_preview = '''		# Círculo de alcance do atirador durante a prévia de construção
		if active_build_definition.kind == StructureDefinition.Kind.SHOOTER:
			var center_preview := (Vector2(current_hover_cell) + Vector2(1.0, 0.5)) * cell_size
			var range_color := Color(0.2, 0.8, 1.0, 0.45) if hover_is_valid else Color(1.0, 0.3, 0.3, 0.35)
			var fill_color := Color(0.2, 0.8, 1.0, 0.08) if hover_is_valid else Color(1.0, 0.3, 0.3, 0.05)
			draw_circle(center_preview, active_build_definition.attack_range_px, fill_color)
			draw_arc(center_preview, active_build_definition.attack_range_px, 0.0, TAU, 64, range_color, 2.0)'''

new_draw_preview = '''		# Círculo de alcance do atirador durante a prévia de construção
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
			draw_texture_rect(TEX_BARRICADE, spr_rect, false, spr_mod)'''

if old_draw_preview in gd_content:
    gd_content = gd_content.replace(old_draw_preview, new_draw_preview)
    print("Updated preview and ghost drawing in map.gd")
else:
    print("Warning: old_draw_preview not found")

# 5. Update _on_camera_pressed so it cycles safely without 180 flip
old_cam_pressed = '''func _on_camera_pressed() -> void:
	is_camera_aligned = not is_camera_aligned
	var target_rot := ALIGNED_CAMERA_ANGLE if is_camera_aligned else 0.0
	if camera_pivot != null:
		var tw := create_tween()
		tw.tween_property(camera_pivot, "rotation", target_rot, 0.35).set_trans(Tween.TRANS_QUAD).set_ease(Tween.EASE_OUT)
	if btn_camera != null:
		btn_camera.text = " 📷 Câmera (%.0f°) " % rad_to_deg(target_rot)
	lbl_status.text = "Câmera %s (Arraste com botão do meio do mouse para girar 360°, ou use a roda para zoom)" % ["alinhada à rota" if is_camera_aligned else "padrão"]
	queue_redraw()'''

new_cam_pressed = '''func _on_camera_pressed() -> void:
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
	queue_redraw()'''

if old_cam_pressed in gd_content:
    gd_content = gd_content.replace(old_cam_pressed, new_cam_pressed)
    print("Updated _on_camera_pressed in map.gd")
else:
    print("Warning: old_cam_pressed not found")

with open('scenes/map/map.gd', 'w', encoding='utf-8') as f:
    f.write(gd_content)
print("Finished patching map.gd")
