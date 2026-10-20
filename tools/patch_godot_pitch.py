with open("scenes/map/map.gd", "r", encoding="utf-8") as f:
    text = f.read()

# Replace middle drag motion
search_frag = """\telif event is InputEventMouseMotion and _middle_dragging:
\t\tvar delta_x: float = event.position.x - _last_drag_pos.x
\t\tif camera_pivot != null:
\t\t\t# Rotação orbital cônica/funil: amplitude limitada (-36° a +36°) para que o mundo NUNCA fique de cabeça para baixo
\t\t\tcamera_pivot.rotation = clampf(camera_pivot.rotation + delta_x * 0.0035, -0.628, 0.628)
\t\t\tif btn_camera:
\t\t\t\tbtn_camera.text = " 📷 Câmera (%.0f°) " % rad_to_deg(camera_pivot.rotation)
\t\t_last_drag_pos = event.position
\t\tqueue_redraw()"""

replace_frag = """\telif event is InputEventMouseMotion and _middle_dragging:
\t\tvar delta_x: float = event.position.x - _last_drag_pos.x
\t\tvar delta_y: float = event.position.y - _last_drag_pos.y
\t\tif camera_pivot != null:
\t\t\t# Rotação orbital cônica/funil: amplitude limitada (-36° a +36°) para que o mundo NUNCA fique de cabeça para baixo
\t\t\tcamera_pivot.rotation = clampf(camera_pivot.rotation + delta_x * 0.0035, -0.628, 0.628)
\t\t\t# Inclinação vertical de profundidade (pitch): 20° a 75°
\t\t\tcamera_pivot.scale.y = clampf(camera_pivot.scale.y - delta_y * 0.0035, 0.45, 1.35)
\t\t\tif btn_camera:
\t\t\t\tvar pitch_deg := roundf(20.0 + ((camera_pivot.scale.y - 0.45) / (1.35 - 0.45)) * 55.0)
\t\t\t\tbtn_camera.text = " 📷 Giro %.0f° · Prof %.0f° " % [rad_to_deg(camera_pivot.rotation), pitch_deg]
\t\t_last_drag_pos = event.position
\t\tqueue_redraw()"""

text = text.replace(search_frag, replace_frag)

# Also update _zoom_camera to allow 0.68x to 2.30x
text = text.replace("clampf(camera.zoom.x * factor, 0.75, 1.8)", "clampf(camera.zoom.x * factor, 0.68, 2.30)")

# Also update _reset_camera
search_reset = """func _reset_camera() -> void:
\tis_camera_aligned = false
\tif camera_pivot != null:
\t\tcamera_pivot.rotation = 0.0
\tif camera != null:
\t\tcamera.zoom = Vector2(1.0, 1.0)"""

replace_reset = """func _reset_camera() -> void:
\tis_camera_aligned = false
\tif camera_pivot != null:
\t\tcamera_pivot.rotation = 0.0
\t\tcamera_pivot.scale = Vector2(1.0, 1.0)
\tif camera != null:
\t\tcamera.zoom = Vector2(1.0, 1.0)"""

text = text.replace(search_reset, replace_reset)

with open("scenes/map/map.gd", "w", encoding="utf-8") as f:
    f.write(text)

print("Godot scenes/map/map.gd updated with Pitch and continuous Zoom!")
