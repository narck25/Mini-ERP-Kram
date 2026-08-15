export { default } from './client'
export { authApi } from './auth'
export { employeeApi } from './employees'
export { vacancyApi } from './vacancies'
export { recruitmentApi } from './recruitment'
export { employeeDocumentApi } from './documents'
export { statsApi } from './stats'
export { permissionApi } from './permissions'
export { systemApi } from './system'
export { stationeryApi } from './stationery'
export { uniformApi } from './uniforms'
export { inventoryAdjustmentApi } from './inventoryAdjustments'
export { inventoryMovementApi } from './inventoryMovements'

export const healthApi = {
  check: () => require('./client').default.get('/health'),
}