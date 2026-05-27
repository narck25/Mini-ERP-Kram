/**
 * Script de diagnóstico para detectar callbacks undefined en rutas Express
 * 
 * Uso: node scripts/diagnostico-callbacks.js
 */

const fs = require('fs');
const path = require('path');

const ROUTES_DIR = path.join(__dirname, '..', 'src', 'routes');
const CONTROLLERS_DIR = path.join(__dirname, '..', 'src', 'controllers');
const MIDDLEWARES_DIR = path.join(__dirname, '..', 'src', 'middlewares');

// Patrones de router methods
const ROUTER_METHODS = /router\.(get|post|put|delete|patch)\(/g;

// Colores para consola
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let totalErrors = 0;
let totalWarnings = 0;

function analyzeFile(filePath) {
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  
  // Extraer imports
  const imports = {};
  const importRegex = /require\(['"](.+?)['"]\)/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    const lineNum = content.substring(0, match.index).split('\n').length;
    
    // Buscar cómo se asigna el require
    const lineBefore = content.substring(0, match.index);
    const varMatch = lineBefore.match(/(?:const|let|var)\s+(\w+)\s*=\s*$/);
    if (varMatch) {
      imports[varMatch[1]] = { path: importPath, line: lineNum };
    }
  }
  
  // Extraer destructuring de imports
  const destructureRegex = /const\s+\{([^}]+)\}\s*=\s*require\(['"](.+?)['"]\)/g;
  while ((match = destructureRegex.exec(content)) !== null) {
    const importedItems = match[1].split(',').map(s => s.trim());
    const importPath = match[2];
    const lineNum = content.substring(0, match.index).split('\n').length;
    
    importedItems.forEach(item => {
      const cleanName = item.split(':')[0].trim().split(/\s+as\s+/)[0].trim();
      imports[cleanName] = { path: importPath, line: lineNum, destructured: true };
    });
  }
  
  // Buscar router.method() calls y verificar callbacks
  const routerCalls = [];
  const routerRegex = /router\.(get|post|put|delete|patch)\(/g;
  let routerMatch;
  
  while ((routerMatch = routerRegex.exec(content)) !== null) {
    const method = routerMatch[1];
    const startPos = routerMatch.index;
    
    // Encontrar el final de la llamada
    let depth = 0;
    let endPos = startPos;
    let inString = false;
    let stringChar = null;
    
    for (let i = startPos; i < content.length; i++) {
      const char = content[i];
      
      if (inString) {
        if (char === '\\') { i++; continue; }
        if (char === stringChar) inString = false;
        continue;
      }
      
      if (char === '"' || char === "'" || char === '`') {
        inString = true;
        stringChar = char;
        continue;
      }
      
      if (char === '(') depth++;
      if (char === ')') {
        depth--;
        if (depth === 0) {
          endPos = i + 1;
          break;
        }
      }
    }
    
    const callContent = content.substring(startPos, endPos);
    const lineNum = content.substring(0, startPos).split('\n').length;
    
    routerCalls.push({ method, content: callContent, line: lineNum });
  }
  
  // Analizar cada llamada router.method()
  routerCalls.forEach(call => {
    // Extraer argumentos de la llamada
    const args = extractArgs(call.content);
    
    // El primer argumento es la ruta (string)
    // Los siguientes son middlewares/callbacks
    const callbacks = args.slice(1);
    
    callbacks.forEach((cb, idx) => {
      const cbTrimmed = cb.trim();
      
      // Si es una función anónima o arrow function, está bien
      if (cbTrimmed.startsWith('function') || cbTrimmed.startsWith('(') || cbTrimmed.startsWith('async')) {
        return;
      }
      
      // Si es un string (ruta), ignorar
      if (cbTrimmed.startsWith("'") || cbTrimmed.startsWith('"') || cbTrimmed.startsWith('`')) {
        return;
      }
      
      // Si es un objeto (config), ignorar
      if (cbTrimmed.startsWith('{')) {
        return;
      }
      
      // Extraer el nombre del callback (puede ser controller.method o middleware.method)
      const cbName = cbTrimmed.split(',')[0].split(')')[0].trim();
      
      if (!cbName) return;
      
      // Verificar si el callback existe en los imports
      const parts = cbName.split('.');
      if (parts.length === 2) {
        const [moduleName, methodName] = parts;
        
        if (imports[moduleName]) {
          // Verificar que el método exista en el módulo importado
          const importInfo = imports[moduleName];
          const modulePath = resolveImportPath(importInfo.path, filePath);
          
          if (modulePath && fs.existsSync(modulePath)) {
            const moduleContent = fs.readFileSync(modulePath, 'utf-8');
            const exportPattern = new RegExp(`exports\\.${methodName}\\s*=\\s*(?:async\\s+)?(?:function\\s+)?\\(`);
            
            if (!exportPattern.test(moduleContent)) {
              console.log(`${RED}❌ ${relativePath}:${call.line}${RESET}`);
              console.log(`   ${YELLOW}${cbName} is undefined (not exported from ${importInfo.path})${RESET}`);
              totalErrors++;
            }
          } else {
            console.log(`${RED}❌ ${relativePath}:${call.line}${RESET}`);
            console.log(`   ${YELLOW}Module not found: ${importInfo.path}${RESET}`);
            totalWarnings++;
          }
        } else {
          console.log(`${RED}❌ ${relativePath}:${call.line}${RESET}`);
          console.log(`   ${YELLOW}${moduleName} is not imported${RESET}`);
          totalErrors++;
        }
      }
    });
  });
}

function extractArgs(content) {
  // Extraer argumentos de router.method('path', arg1, arg2, ...)
  const parenMatch = content.match(/router\.\w+\(([\s\S]*)\)$/);
  if (!parenMatch) return [];
  
  let argsStr = parenMatch[1];
  let args = [];
  let depth = 0;
  let current = '';
  let inString = false;
  let stringChar = null;
  
  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i];
    
    if (inString) {
      if (char === '\\') { current += char; i++; current += argsStr[i]; continue; }
      if (char === stringChar) inString = false;
      current += char;
      continue;
    }
    
    if (char === '"' || char === "'" || char === '`') {
      inString = true;
      stringChar = char;
      current += char;
      continue;
    }
    
    if (char === '(' || char === '{' || char === '[') {
      depth++;
      current += char;
      continue;
    }
    
    if (char === ')' || char === '}' || char === ']') {
      depth--;
      current += char;
      continue;
    }
    
    if (char === ',' && depth === 0) {
      args.push(current.trim());
      current = '';
      continue;
    }
    
    current += char;
  }
  
  if (current.trim()) {
    args.push(current.trim());
  }
  
  return args;
}

function resolveImportPath(importPath, fromFile) {
  if (importPath.startsWith('.')) {
    return path.resolve(path.dirname(fromFile), importPath) + '.js';
  }
  // Para módulos de node_modules, no podemos verificar fácilmente
  return null;
}

console.log(`${BOLD}${CYAN}========================================${RESET}`);
console.log(`${BOLD}${CYAN}  DIAGNÓSTICO DE CALLBACKS UNDEFINED${RESET}`);
console.log(`${BOLD}${CYAN}========================================${RESET}\n`);

// Analizar todos los archivos de rutas
const routeFiles = fs.readdirSync(ROUTES_DIR).filter(f => f.endsWith('.routes.js'));

routeFiles.forEach(file => {
  const filePath = path.join(ROUTES_DIR, file);
  analyzeFile(filePath);
});

console.log(`\n${BOLD}${CYAN}========================================${RESET}`);
console.log(`${BOLD}${CYAN}  RESUMEN${RESET}`);
console.log(`${BOLD}${CYAN}========================================${RESET}`);
console.log(`Archivos analizados: ${routeFiles.length}`);
console.log(`Errores encontrados: ${totalErrors > 0 ? RED + totalErrors : GREEN + totalErrors}${RESET}`);
console.log(`Advertencias: ${totalWarnings > 0 ? YELLOW + totalWarnings : GREEN + totalWarnings}${RESET}`);

if (totalErrors === 0 && totalWarnings === 0) {
  console.log(`\n${GREEN}${BOLD}✅ No se encontraron callbacks undefined${RESET}`);
}

process.exit(totalErrors > 0 ? 1 : 0);
