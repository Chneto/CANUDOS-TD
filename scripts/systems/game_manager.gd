class_name GameManager
extends Node

## Autoridade do estado global da partida no MVP.
## A cena/HUD deve observar os sinais, sem alterar estas propriedades diretamente.

signal phase_changed(new_phase: Phase)
signal objective_health_changed(current: int, maximum: int)
signal materials_changed(current: int)
signal enemies_alive_changed(current: int)
signal run_finished(won: bool)
signal run_reset

enum Phase {
	PREPARATION,
	WAVE_ACTIVE,
	VICTORY,
	DEFEAT,
}

const DEFAULT_OBJECTIVE_HEALTH: int = 100
const DEFAULT_STARTING_MATERIALS: int = 120
const DEFAULT_ENEMY_REWARD: int = 5
const DEFAULT_WAVE_REWARD: int = 15

@export_range(1, 100000, 1) var objective_max_health: int = DEFAULT_OBJECTIVE_HEALTH
@export_range(0, 100000, 1) var starting_materials: int = DEFAULT_STARTING_MATERIALS
@export_range(0, 100000, 1) var default_enemy_reward: int = DEFAULT_ENEMY_REWARD

var phase: Phase = Phase.PREPARATION
var objective_health: int = DEFAULT_OBJECTIVE_HEALTH
var materials: int = DEFAULT_STARTING_MATERIALS
var current_wave: int = 1
var enemies_alive: int = 0

var _spawning_complete: bool = false


func _ready() -> void:
	reset_run()


## Começa a onda única do MVP. Retorna false se a partida não estiver em preparação.
func start_wave() -> bool:
	if phase != Phase.PREPARATION:
		return false

	_spawning_complete = false
	_set_phase(Phase.WAVE_ACTIVE)
	return true


## Registra uma unidade criada pelo WaveManager durante a onda ativa.
func register_enemy_spawned() -> bool:
	if phase != Phase.WAVE_ACTIVE:
		return false

	enemies_alive += 1
	enemies_alive_changed.emit(enemies_alive)
	return true


## Deve ser chamado quando o gerador terminou de criar todas as unidades da onda.
## Evita declarar vitória antes de a última unidade ter sido criada.
func finish_enemy_spawning() -> void:
	if phase != Phase.WAVE_ACTIVE:
		return

	_spawning_complete = true
	_try_finish_wave()


## Chamado uma única vez pelo fluxo de morte do inimigo.
func report_enemy_defeated(reward: int = -1) -> void:
	if not _remove_active_enemy():
		return

	var payout := default_enemy_reward if reward < 0 else reward
	add_materials(payout)
	_try_finish_wave()


## Unidade que alcança o objetivo causa dano, mas não concede recompensa.
func report_enemy_reached_objective(damage: int) -> void:
	if not _remove_active_enemy():
		return

	if damage > 0:
		objective_health = maxi(0, objective_health - damage)
		objective_health_changed.emit(objective_health, objective_max_health)

	if objective_health == 0:
		_set_phase(Phase.DEFEAT)
		run_finished.emit(false)
		return

	_try_finish_wave()


## Gasta materiais atomicamente: não altera o saldo se não houver recursos suficientes.
func try_spend_materials(amount: int) -> bool:
	if amount < 0 or materials < amount:
		return false

	materials -= amount
	materials_changed.emit(materials)
	return true


func add_materials(amount: int) -> void:
	if amount <= 0:
		return

	materials += amount
	materials_changed.emit(materials)


## Reinicia os valores da partida para uma nova tentativa.
func reset_run() -> void:
	objective_max_health = maxi(1, objective_max_health)
	objective_health = objective_max_health
	starting_materials = maxi(0, starting_materials)
	materials = starting_materials
	current_wave = 1
	enemies_alive = 0
	_spawning_complete = false

	objective_health_changed.emit(objective_health, objective_max_health)
	materials_changed.emit(materials)
	enemies_alive_changed.emit(enemies_alive)
	phase = Phase.PREPARATION
	phase_changed.emit(phase)
	run_reset.emit()


func _remove_active_enemy() -> bool:
	if phase != Phase.WAVE_ACTIVE or enemies_alive <= 0:
		return false

	enemies_alive -= 1
	enemies_alive_changed.emit(enemies_alive)
	return true


func _try_finish_wave() -> void:
	if phase != Phase.WAVE_ACTIVE or not _spawning_complete or enemies_alive != 0:
		return

	add_materials(DEFAULT_WAVE_REWARD)
	_set_phase(Phase.VICTORY)
	run_finished.emit(true)


func _set_phase(new_phase: Phase) -> void:
	if phase == new_phase:
		return

	phase = new_phase
	phase_changed.emit(phase)
