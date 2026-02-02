/**
 * 构建 A 股股票数据库脚本
 * 从 tushare_stock_basic.csv 读取数据，生成 stock-database.json
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// CSV 文件路径
const csvFilePath = path.join(__dirname, '../tmp_data/tushare_stock_basic.csv')
// 输出 JSON 文件路径
const jsonFilePath = path.join(__dirname, '../src/data/stock-database.json')

console.log('开始构建股票数据库...')
console.log(`CSV 文件: ${csvFilePath}`)
console.log(`输出文件: ${jsonFilePath}`)

// 确保输出目录存在
const outputDir = path.dirname(jsonFilePath)
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
  console.log(`创建目录: ${outputDir}`)
}

// 读取 CSV 文件
if (!fs.existsSync(csvFilePath)) {
  console.error(`错误: CSV 文件不存在: ${csvFilePath}`)
  console.log('请确保 tushare_stock_basic.csv 文件位于 tmp_data/ 目录下')
  process.exit(1)
}

const csvContent = fs.readFileSync(csvFilePath, 'utf8')

// 解析 CSV 行
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // 转义的引号
        current += '"'
        i++
      } else {
        // 切换引号状态
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // 字段分隔符
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)

  return result.map(field => {
    // 移除引号
    if (field.startsWith('"') && field.endsWith('"')) {
      return field.slice(1, -1).replace(/""/g, '"')
    }
    return field.trim()
  })
}

// 解析 CSV
function parseCSV(content) {
  // 移除 BOM 标记
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1)
  }

  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length < 2) {
    throw new Error('CSV 文件格式错误或为空')
  }

  // 解析表头
  const headers = parseCSVLine(lines[0])

  const data = []

  // 解析数据行
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])

    if (values.length !== headers.length) {
      console.warn(`第 ${i + 1} 行字段数不匹配，跳过`)
      continue
    }

    const row = {}
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j]
    }

    // 只包含上市状态的股票 (list_status = 'L')
    if (row.list_status === 'L' && row.ts_code && row.name) {
      data.push(row)
    }
  }

  return data
}

try {
  const stockData = parseCSV(csvContent)

  console.log(`解析完成，共 ${stockData.length} 只股票`)

  // 统计信息
  const exchanges = new Set(stockData.map(s => s.exchange))
  const industries = new Set(stockData.map(s => s.industry))
  const markets = new Set(stockData.map(s => s.market))

  console.log('\n数据库统计:')
  console.log(`  - 总股票数: ${stockData.length}`)
  console.log(`  - 交易所: ${Array.from(exchanges).join(', ')}`)
  console.log(`  - 行业数: ${industries.size}`)
  console.log(`  - 市场类型: ${Array.from(markets).join(', ')}`)

  // 写入 JSON 文件
  const jsonData = JSON.stringify(stockData, null, 2)
  fs.writeFileSync(jsonFilePath, jsonData, 'utf8')

  console.log(`\n数据库构建成功!`)
  console.log(`文件大小: ${(fs.statSync(jsonFilePath).size / 1024 / 1024).toFixed(2)} MB`)

} catch (error) {
  console.error('构建失败:', error.message)
  process.exit(1)
}
