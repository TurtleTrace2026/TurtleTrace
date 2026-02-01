import type { NewsItem } from '../types'

// 模拟新闻数据模板
const newsTemplates = [
  {
    title: '{name}发布年度业绩预告，净利润预计同比增长{percent}%',
    source: '上海证券报',
    summary: '{name}今日发布业绩预告，预计年度净利润将达到{amount}亿元，同比增长{percent}%，业绩表现超出市场预期。',
  },
  {
    title: '机构调研{symbol}：多家基金公司集中关注',
    source: '证券时报',
    summary: '近日，多家知名基金公司对{name}进行了集中调研，重点关注公司新产品研发进展及市场拓展情况。',
  },
  {
    title: '{name}宣布重大战略合作，布局{sector}领域',
    source: '中国证券报',
    summary: '{name}今日宣布与行业领军企业达成战略合作，双方将在{sector}领域展开深度合作，共同开拓市场。',
  },
  {
    title: '北向资金{action}{name}，单日{actionAmount}亿元',
    source: '东方财富网',
    summary: '据数据显示，北向资金今日{action}{name}{actionAmount}亿元，显示外资对该股的态度发生转变。',
  },
  {
    title: '{name}获{count}家机构买入评级，目标价{targetPrice}元',
    source: '新浪财经',
    summary: '最新研报显示，共有{count}家券商给予{name}买入评级，平均目标价{targetPrice}元，较当前价格仍有上涨空间。',
  },
  {
    title: '行业政策利好出台，{name}等龙头股受益',
    source: '第一财经',
    summary: '相关部门近日发布{sector}行业支持政策，预计将对行业格局产生积极影响，{name}等行业龙头有望率先受益。',
  },
]

const sectors = ['新能源', '半导体', '医药', '消费', '金融', '地产']
const actions = ['增持', '减持']

// 填充模板变量
function fillTemplate(template: string, symbol: string, name: string): string {
  const percent = Math.floor(Math.random() * 50) + 10
  const amount = (Math.random() * 100 + 10).toFixed(1)
  const sector = sectors[Math.floor(Math.random() * sectors.length)]
  const action = actions[Math.floor(Math.random() * actions.length)]
  const actionAmount = (Math.random() * 5 + 0.5).toFixed(2)
  const count = Math.floor(Math.random() * 15) + 5
  const targetPrice = (Math.random() * 200 + 20).toFixed(2)

  return template
    .replace(/{symbol}/g, symbol)
    .replace(/{name}/g, name)
    .replace(/{percent}/g, percent.toString())
    .replace(/{amount}/g, amount)
    .replace(/{sector}/g, sector)
    .replace(/{action}/g, action)
    .replace(/{actionAmount}/g, actionAmount)
    .replace(/{count}/g, count.toString())
    .replace(/{targetPrice}/g, targetPrice)
}

// 获取股票相关新闻（模拟）
export async function getStockNews(symbols: string[]): Promise<NewsItem[]> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))

  const news: NewsItem[] = []
  const now = Date.now()

  // 为每只股票生成 1-3 条新闻
  for (const symbol of symbols) {
    const newsCount = Math.floor(Math.random() * 3) + 1

    for (let i = 0; i < newsCount; i++) {
      const template = newsTemplates[Math.floor(Math.random() * newsTemplates.length)]
      const name = getStockName(symbol)
      if (!name) continue

      news.push({
        id: `${symbol}-${now}-${i}`,
        title: fillTemplate(template.title, symbol, name),
        source: template.source,
        url: `#news-${symbol}-${now}-${i}`,
        publishTime: now - Math.random() * 86400000 * 3, // 最近3天内
        summary: fillTemplate(template.summary || '', symbol, name),
        relatedSymbols: [symbol],
      })
    }
  }

  // 按发布时间排序
  return news.sort((a, b) => b.publishTime - a.publishTime)
}

// 获取股票名称（从股票服务引用）
function getStockName(symbol: string): string | null {
  const stockNames: Record<string, string> = {
    '600519.SH': '贵州茅台',
    '000858.SZ': '五粮液',
    '600036.SH': '招商银行',
    '000001.SZ': '平安银行',
    '601318.SH': '中国平安',
    '000333.SZ': '美的集团',
    '600276.SH': '恒瑞医药',
    '300059.SZ': '东方财富',
    '600900.SH': '长江电力',
    '601012.SH': '隆基绿能',
    '002594.SZ': '比亚迪',
    '600887.SH': '伊利股份',
  }
  return stockNames[symbol] || null
}

// 获取市场要闻（模拟）
export async function getMarketNews(): Promise<NewsItem[]> {
  await new Promise(resolve => setTimeout(resolve, 200))

  return [
    {
      id: 'market-1',
      title: 'A股三大指数集体收涨，成交额突破万亿',
      source: '央视财经',
      url: '#market-1',
      publishTime: Date.now() - 3600000,
      summary: '今日A股三大指数集体收涨，其中沪指涨1.2%，深成指涨1.5%，创业板指涨1.8%。两市成交额突破1.2万亿元，市场情绪明显回暖。',
      relatedSymbols: [],
    },
    {
      id: 'market-2',
      title: '北向资金净流入超百亿，连续5日加仓A股',
      source: '证券时报',
      url: '#market-2',
      publishTime: Date.now() - 7200000,
      summary: '北向资金今日净流入A股超100亿元，已连续5个交易日呈现净流入态势，显示外资对A股市场的信心持续增强。',
      relatedSymbols: [],
    },
  ]
}
