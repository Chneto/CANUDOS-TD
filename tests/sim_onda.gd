extends SceneTree

## Joga a onda do MVP sozinho, em cenários, e confere o resultado.
## Sai com código 1 se alguma verificação falhar.
##
## Rodar:     godot --headless --fixed-fps 60 --path . -s res://tests/sim_onda.gd
## Capturas:  godot --fixed-fps 60 --path . -s res://tests/sim_onda.gd -- --shot <pasta>
##
## --fixed-fps 60 faz cada quadro valer 1/60 s, então a onda roda mais rápido que o tempo real.

const MAP_SCENE := "res://scenes/map/map.tscn"
const FPS := 60.0
const LIMITE_S := 180.0

var _falhas := 0


func _initialize() -> void:
	_run.call_deferred()


func _run() -> void:
	var args := OS.get_cmdline_user_args()
	var shot_index := args.find("--shot")
	if shot_index >= 0:
		await _capturas(args[shot_index + 1])
		quit()
		return

	await _teste_sem_defesa_e_reinicio()
	await _teste_atiradores_em_campo_aberto()
	await _teste_pontos_fixos()
	await _teste_barricadas()
	await _teste_validacao_e_rotulos()
	await _teste_clique()
	await _teste_campeao_conselheiro()

	print("\n%s" % ("TUDO OK" if _falhas == 0 else "%d VERIFICAÇÃO(ÕES) FALHARAM" % _falhas))
	quit(1 if _falhas > 0 else 0)


func _check(ok: bool, texto: String) -> void:
	print("  [%s] %s" % ["ok" if ok else "FALHOU", texto])
	if not ok:
		_falhas += 1


func _novo_mapa() -> MapScene:
	var map: MapScene = load(MAP_SCENE).instantiate()
	root.add_child(map)
	await process_frame
	return map


func _fechar(map: MapScene) -> void:
	map.queue_free()
	await process_frame


## Constrói pela PlacementManager. Cada item é ["s" | "b", célula]. Devolve {célula: contador de tiros}.
func _construir(map: MapScene, construcoes: Array) -> Dictionary:
	var tiros := {}
	for c in construcoes:
		var def: StructureDefinition = map.shooter_definition if c[0] == "s" else map.barricade_definition
		var cell: Vector2i = c[1]
		var st := map.placement_manager.place_structure(def, cell)
		if st == null:
			print("  recusou %s em %s: %s" % [def.display_name, cell, map.placement_manager.placement_status(def, cell)["reason"]])
			continue
		if st is DefenseStructure:
			tiros[cell] = 0
			st.attack_fired.connect(func(_alvo: Enemy) -> void: tiros[cell] += 1)
	return tiros


## Aperta "Iniciar Combate" e joga até a partida terminar.
func _jogar_onda(map: MapScene) -> Dictionary:
	var r := {"won": false, "segundos": 0.0, "max_giro": 0.0, "parou_em_barricada": false}
	map.btn_wave.pressed.emit()
	var frames := 0
	while map.game_manager.phase == GameManager.Phase.WAVE_ACTIVE and frames < int(FPS * LIMITE_S):
		await process_frame
		frames += 1
		for node in get_nodes_in_group("enemies"):
			var en := node as Enemy
			if en == null or not is_instance_valid(en):
				continue
			r["max_giro"] = maxf(r["max_giro"], absf(rad_to_deg(en.global_rotation)))
			if en.state == Enemy.State.ATTACKING_BARRICADE:
				r["parou_em_barricada"] = true
	r["won"] = map.game_manager.phase == GameManager.Phase.VICTORY
	r["segundos"] = frames / FPS
	var gm := map.game_manager
	print("  %s em %.1f s | igreja %d/%d | materiais %d" % [GameManager.Phase.keys()[gm.phase], r["segundos"], gm.objective_health, gm.objective_max_health, gm.materials])
	return r


func _teste_sem_defesa_e_reinicio() -> void:
	print("\n=== Sem defesa, depois reinício")
	var map := await _novo_mapa()
	_check(not map.btn_restart.visible, "botão Reiniciar escondido na preparação")
	var r := await _jogar_onda(map)
	_check(map.game_manager.phase == GameManager.Phase.DEFEAT, "sem defesa, a igreja cai")
	_check(r["max_giro"] < 1.0, "soldado não gira na rota (maior giro %.0f°)" % r["max_giro"])
	_check(map.btn_restart.visible, "botão Reiniciar aparece depois da derrota")

	map.btn_restart.pressed.emit()
	await process_frame
	var gm := map.game_manager
	_check(gm.phase == GameManager.Phase.PREPARATION, "reinício volta para a preparação")
	_check(gm.materials == gm.starting_materials and gm.objective_health == gm.objective_max_health, "reinício restaura materiais e igreja")
	_check(get_nodes_in_group("enemies").is_empty(), "reinício remove os soldados restantes")
	_check(not map.btn_restart.visible and not map.btn_wave.disabled, "depois do reinício, Iniciar Combate volta a valer")
	map.btn_wave.pressed.emit()
	_check(gm.phase == GameManager.Phase.WAVE_ACTIVE, "segunda onda começa depois do reinício")
	await _fechar(map)


func _teste_atiradores_em_campo_aberto() -> void:
	print("\n=== Dois atiradores em campo aberto, perto da reta longa")
	var map := await _novo_mapa()
	var tiros := _construir(map, [["s", Vector2i(10, 7)], ["s", Vector2i(12, 5)]])
	_check(tiros.size() == 2 and map.game_manager.materials == 0, "dois atiradores custam os 120 materiais iniciais")
	var r := await _jogar_onda(map)
	_check(r["won"], "a onda é vencida")
	await _fechar(map)


func _teste_pontos_fixos() -> void:
	print("\n=== Atiradores nos pontos fixos")
	for site in [&"site_f1", &"site_f2", &"site_f3"]:
		var map := await _novo_mapa()
		var cell: Vector2i
		for s in map.map_definition.fixed_sites:
			if s.site_id == site:
				cell = s.cells[0]
		map.game_manager.add_materials(1000)
		var tiros := _construir(map, [["s", cell]])
		await _jogar_onda(map)
		_check(tiros.get(cell, 0) > 0, "atirador em %s %s dispara (%d tiros)" % [site, cell, tiros.get(cell, 0)])
		await _fechar(map)


func _teste_barricadas() -> void:
	print("\n=== Barricadas B1, B2 e B3, sem atiradores")
	var map := await _novo_mapa()
	_construir(map, [["b", Vector2i(4, 2)], ["b", Vector2i(8, 5)], ["b", Vector2i(16, 7)]])
	var r := await _jogar_onda(map)
	_check(r["parou_em_barricada"], "soldados param para atacar a barricada")
	await _fechar(map)


func _teste_validacao_e_rotulos() -> void:
	print("\n=== Validação de construção e rótulos")
	var map := await _novo_mapa()
	var pm := map.placement_manager
	_check(not pm.placement_status(map.shooter_definition, Vector2i(2, 2))["valid"], "atirador recusado na rota")
	_check(not pm.placement_status(map.barricade_definition, Vector2i(10, 7))["valid"], "barricada recusada fora das posições reservadas")
	_check(not pm.placement_status(map.shooter_definition, Vector2i(14, 9))["valid"], "atirador recusado no objetivo")
	_check(pm.placement_status(map.barricade_definition, Vector2i(4, 2))["valid"], "barricada aceita em B1")
	for pair in [[map.btn_sniper, map.shooter_definition], [map.btn_barricade, map.barricade_definition]]:
		var btn: Button = pair[0]
		var def: StructureDefinition = pair[1]
		_check(btn.text.contains("(%d M)" % def.cost_materials), "botão \"%s\" mostra o custo cobrado (%d)" % [btn.text.strip_edges(), def.cost_materials])
	await _fechar(map)


func _teste_clique() -> void:
	print("\n=== Construção pelo mouse")
	var map := await _novo_mapa()
	map.btn_sniper.pressed.emit()
	# Eventos entram em coordenadas da janela; a escala do stretch (64x64 px em --headless) os converte para o mapa.
	var alvo := root.get_final_transform() * map.map_definition.cell_center(Vector2i(12, 5))
	var mover := InputEventMouseMotion.new()
	mover.position = alvo
	root.push_input(mover)
	var clique := InputEventMouseButton.new()
	clique.button_index = MOUSE_BUTTON_LEFT
	clique.pressed = true
	clique.position = alvo
	root.push_input(clique)
	await process_frame
	_check(map.game_manager.materials == map.game_manager.starting_materials - map.shooter_definition.cost_materials, "clique na célula (12, 5) constrói o atirador")
	await _fechar(map)


func _capturas(pasta: String) -> void:
	var map := await _novo_mapa()
	_construir(map, [["s", Vector2i(3, 6)], ["b", Vector2i(8, 5)], ["b", Vector2i(16, 7)]])
	for i in 10:
		await process_frame
	root.get_texture().get_image().save_png(pasta.path_join("canudos_1_preparacao.png"))
	map.btn_wave.pressed.emit()
	for i in int(FPS * 7):
		await process_frame
	root.get_texture().get_image().save_png(pasta.path_join("canudos_2_onda.png"))
	var frames := 0
	while map.game_manager.phase == GameManager.Phase.WAVE_ACTIVE and frames < int(FPS * LIMITE_S):
		await process_frame
		frames += 1
	for i in 10:
		await process_frame
	root.get_texture().get_image().save_png(pasta.path_join("canudos_3_fim.png"))
	print("capturas salvas em ", pasta)


func _teste_campeao_conselheiro() -> void:
	print("\n=== Campeão Antônio Conselheiro e Habilidades")
	var map := await _novo_mapa()
	_check(map.champion != null, "nó do Campeão instanciado")
	_check(map.champion.can_use_mutirao(), "Mutirão disponível no início")
	_check(not map.champion.can_use_predica(), "Prédica bloqueada fora do combate")

	var ok_move := map.champion.move_to_cell(Vector2i(10, 5))
	_check(ok_move, "Conselheiro aceita mover para célula fora da estrada")
	_check(not map.champion.move_to_cell(Vector2i(4, 1)), "Conselheiro recusa mover para a estrada")

	var st := map.placement_manager.place_structure(map.barricade_definition, Vector2i(4, 2))
	if st is Barricade:
		st.take_damage(100.0)
		_check(st.health < st.definition.max_health, "Barricada sofreu dano inicial")
		map.champion.global_position = st.global_position
		map.champion.is_moving = false
		var res := map.champion.use_mutirao()
		_check(res["ok"] and res["repaired"] >= 1, "Mutirão reparou a barricada próxima")
		_check(st.health == st.definition.max_health, "Barricada totalmente recuperada pelo Mutirão")

	await _fechar(map)
