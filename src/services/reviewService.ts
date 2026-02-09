import type { DailyReview } from '../types/review';

const REVIEWS_STORAGE_KEY = 'stock_app_reviews';

/**
 * 每日复盘服务
 * 提供复盘记录的增删改查、初始化和导出功能
 */
class ReviewService {
  /**
   * 获取指定日期的复盘
   */
  async getReview(date: string): Promise<DailyReview | null> {
    try {
      const reviews = await this.getAllReviews();
      return reviews.find(r => r.date === date) || null;
    } catch (error) {
      console.error('获取复盘失败:', error);
      return null;
    }
  }

  /**
   * 保存复盘
   */
  async saveReview(review: DailyReview): Promise<boolean> {
    try {
      const reviews = await this.getAllReviews();
      const existingIndex = reviews.findIndex(r => r.date === review.date);

      if (existingIndex >= 0) {
        // 更新现有记录
        reviews[existingIndex] = { ...review, updatedAt: Date.now() };
      } else {
        // 添加新记录
        reviews.push(review);
      }

      // 按日期降序排序
      reviews.sort((a, b) => b.date.localeCompare(a.date));

      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
      return true;
    } catch (error) {
      console.error('保存复盘失败:', error);
      return false;
    }
  }

  /**
   * 获取所有复盘记录
   */
  async getAllReviews(): Promise<DailyReview[]> {
    try {
      const data = localStorage.getItem(REVIEWS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('获取复盘列表失败:', error);
      return [];
    }
  }

  /**
   * 获取日期范围内的复盘
   */
  async getReviewsByRange(startDate: string, endDate: string): Promise<DailyReview[]> {
    try {
      const reviews = await this.getAllReviews();
      return reviews.filter(r => r.date >= startDate && r.date <= endDate);
    } catch (error) {
      console.error('获取日期范围复盘失败:', error);
      return [];
    }
  }

  /**
   * 删除复盘
   */
  async deleteReview(date: string): Promise<boolean> {
    try {
      const reviews = await this.getAllReviews();
      const filtered = reviews.filter(r => r.date !== date);
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('删除复盘失败:', error);
      return false;
    }
  }

  /**
   * 复制复盘到新日期
   */
  async duplicateReview(fromDate: string, toDate: string): Promise<boolean> {
    try {
      const original = await this.getReview(fromDate);
      if (!original) return false;

      const duplicate: DailyReview = {
        ...original,
        id: toDate,
        date: toDate,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      return await this.saveReview(duplicate);
    } catch (error) {
      console.error('复制复盘失败:', error);
      return false;
    }
  }

  /**
   * 初始化今日复盘（自动填充基础数据）
   */
  async initializeTodayReview(date: string): Promise<DailyReview> {
    const existing = await this.getReview(date);
    if (existing) return existing;

    const now = Date.now();
    const review: DailyReview = {
      id: date,
      date,
      createdAt: now,
      updatedAt: now,
    };

    return review;
  }

  /**
   * 导出复盘为Markdown
   */
  async exportToMarkdown(date: string): Promise<string> {
    const review = await this.getReview(date);
    if (!review) return '';

    const lines: string[] = [];

    // 标题
    lines.push(`# 每日复盘 - ${review.date}`);
    lines.push('');

    // 1. 大盘指数与关键数据
    if (review.marketData) {
      lines.push('## 📊 大盘指数与关键数据');
      lines.push('');

      const moodMap = { bullish: '看多📈', bearish: '看空📉', neutral: '中性➡️' };
      lines.push(`**市场情绪**: ${moodMap[review.marketData.marketMood]}`);

      if (review.marketData.moodNote) {
        lines.push(`**备注**: ${review.marketData.moodNote}`);
      }
      lines.push('');

      lines.push('| 指数 | 涨跌幅 | 涨跌点数 | 成交额 |');
      lines.push('|------|--------|----------|--------|');
      for (const idx of review.marketData.indices) {
        const changeStr = idx.change >= 0 ? `+${idx.change.toFixed(2)}%` : `${idx.change.toFixed(2)}%`;
        lines.push(`| ${idx.name} | ${changeStr} | ${idx.changeAmount.toFixed(2)} | ${(idx.amount / 100000000).toFixed(2)}亿 |`);
      }
      lines.push('');
    }

    // 2. 板块追踪与资金流向
    if (review.sectorData) {
      lines.push('## 🔥 板块追踪与资金流向');
      lines.push('');

      if (review.sectorData.hotSectors.length > 0) {
        lines.push('### 热门板块');
        lines.push('');
        for (const sector of review.sectorData.hotSectors) {
          lines.push(`- **${sector.name}**: ${sector.change >= 0 ? '+' : ''}${sector.change.toFixed(2)}%`);
          if (sector.reason) {
            lines.push(`  - 原因: ${sector.reason}`);
          }
        }
        lines.push('');
      }

      if (review.sectorData.coldSectors.length > 0) {
        lines.push('### 冷门板块');
        lines.push('');
        for (const sector of review.sectorData.coldSectors) {
          lines.push(`- **${sector.name}**: ${sector.change >= 0 ? '+' : ''}${sector.change.toFixed(2)}%`);
        }
        lines.push('');
      }

      if (review.sectorData.overallFlow) {
        lines.push(`**整体资金流向**: ${review.sectorData.overallFlow}`);
        lines.push('');
      }
    }

    // 3. 持仓买卖情况
    if (review.positionData) {
      lines.push('## 💼 持仓买卖情况');
      lines.push('');

      const { dailySummary } = review.positionData;
      const profitStr = dailySummary.totalProfit >= 0 ? `+¥${dailySummary.totalProfit.toFixed(2)}` : `¥${dailySummary.totalProfit.toFixed(2)}`;
      lines.push(`**当日盈亏**: ${profitStr}`);
      lines.push(`**盈/亏**: ${dailySummary.winCount} / ${dailySummary.lossCount}`);
      lines.push(`**胜率**: ${(dailySummary.winRate * 100).toFixed(1)}%`);
      lines.push('');

      if (review.positionData.positions.length > 0) {
        lines.push('| 股票 | 涨跌幅 | 当日盈亏 | 总盈亏 | 次日最高 | 次日最低 | 次日次高 | 次日次低 |');
        lines.push('|------|--------|----------|--------|----------|----------|----------|----------|');
        for (const pos of review.positionData.positions) {
          const changeStr = pos.change >= 0 ? `+${pos.change.toFixed(2)}%` : `${pos.change.toFixed(2)}%`;
          const dailyProfitStr = pos.dailyProfit >= 0 ? `+${pos.dailyProfit.toFixed(2)}` : `${pos.dailyProfit.toFixed(2)}`;
          const totalProfitStr = pos.totalProfit >= 0 ? `+${pos.totalProfit.toFixed(2)}` : `${pos.totalProfit.toFixed(2)}`;
          const nextHighStr = pos.nextHigh ? `¥${pos.nextHigh.toFixed(2)}` : '-';
          const nextLowStr = pos.nextLow ? `¥${pos.nextLow.toFixed(2)}` : '-';
          const nextSecondaryHighStr = pos.nextSecondaryHigh ? `¥${pos.nextSecondaryHigh.toFixed(2)}` : '-';
          const nextSecondaryLowStr = pos.nextSecondaryLow ? `¥${pos.nextSecondaryLow.toFixed(2)}` : '-';
          lines.push(`| ${pos.name} | ${changeStr} | ${dailyProfitStr} | ${totalProfitStr} | ${nextHighStr} | ${nextLowStr} | ${nextSecondaryHighStr} | ${nextSecondaryLowStr} |`);
          if (pos.note) {
            lines.push(`| &nbsp; | *备注: ${pos.note}* | | | | | | |`);
          }
        }
        lines.push('');
      }
    }

    // 4. 龙虎榜与机构动向
    if (review.dragonTiger) {
      lines.push('## 🏆 龙虎榜与机构动向');
      lines.push('');

      if (review.dragonTiger.stocks.length > 0) {
        for (const stock of review.dragonTiger.stocks) {
          lines.push(`- **${stock.name} (${stock.symbol})**`);
          lines.push(`  - 上榜原因: ${stock.reason}`);
          lines.push(`  - 净买入: ${stock.netBuy >= 0 ? '+' : ''}${(stock.netBuy / 10000).toFixed(2)}万`);
          if (stock.institution) {
            lines.push(`  - 机构: ${stock.institution}`);
          }
        }
        lines.push('');
      }

      if (review.dragonTiger.summary) {
        lines.push(`**机构动向总结**: ${review.dragonTiger.summary}`);
        lines.push('');
      }
    }

    // 5. 消息面汇总和解读
    if (review.newsDigest) {
      lines.push('## 📰 消息面汇总和解读');
      lines.push('');

      if (review.newsDigest.majorNews.length > 0) {
        lines.push('### 重要新闻');
        lines.push('');
        for (const news of review.newsDigest.majorNews) {
          const impactIcon = { positive: '🟢', negative: '🔴', neutral: '⚪' }[news.impact];
          lines.push(`${impactIcon} **${news.title}**`);
          lines.push(`   - 来源: ${news.source} | 时间: ${news.time}`);
          if (news.interpretation) {
            lines.push(`   - 解读: ${news.interpretation}`);
          }
          if (news.relatedStocks && news.relatedStocks.length > 0) {
            lines.push(`   - 相关: ${news.relatedStocks.join(', ')}`);
          }
        }
        lines.push('');
      }

      if (review.newsDigest.overall) {
        lines.push(`**整体消息面**: ${review.newsDigest.overall}`);
        lines.push('');
      }
    }

    // 6. 今日操作回顾与反思
    if (review.operations) {
      lines.push('## 📝 今日操作回顾与反思');
      lines.push('');

      if (review.operations.transactions.length > 0) {
        lines.push('### 交易记录');
        lines.push('');
        for (const tx of review.operations.transactions) {
          const typeStr = tx.type === 'buy' ? '买入' : '卖出';
          lines.push(`- ${typeStr} **${tx.symbol}**: ${tx.quantity}股 @ ¥${tx.price.toFixed(2)}`);
          lines.push(`  - 金额: ¥${tx.amount.toFixed(2)} | 情绪: ${tx.mood}`);
          if (tx.reason.length > 0) {
            lines.push(`  - 原因: ${tx.reason.join(', ')}`);
          }
        }
        lines.push('');
      }

      lines.push('### 反思总结');
      lines.push('');

      if (review.operations.reflection.whatWorked) {
        lines.push(`✅ **做得好的地方**: ${review.operations.reflection.whatWorked}`);
        lines.push('');
      }

      if (review.operations.reflection.whatFailed) {
        lines.push(`❌ **做的不好的地方**: ${review.operations.reflection.whatFailed}`);
        lines.push('');
      }

      if (review.operations.reflection.lessons) {
        lines.push(`💡 **经验教训**: ${review.operations.reflection.lessons}`);
        lines.push('');
      }

      if (review.operations.reflection.emotionalState) {
        lines.push(`😊 **情绪状态**: ${review.operations.reflection.emotionalState}`);
        lines.push('');
      }
    }

    // 7. 明日策略与计划
    if (review.tomorrowPlan) {
      lines.push('## 🎯 明日策略与计划');
      lines.push('');

      lines.push(`**整体策略**: ${review.tomorrowPlan.strategy}`);
      lines.push('');

      if (review.tomorrowPlan.watchList.length > 0) {
        lines.push('### 关注列表');
        lines.push('');
        const actionMap = { buy: '买入', sell: '卖出', hold: '持有', observe: '观察' };
        for (const item of review.tomorrowPlan.watchList) {
          lines.push(`- **${item.name} (${item.symbol})** - ${actionMap[item.action]}`);
          lines.push(`  - 原因: ${item.reason}`);
          if (item.targetPrice) {
            lines.push(`  - 目标价: ¥${item.targetPrice.toFixed(2)}`);
          }
          if (item.stopLoss) {
            lines.push(`  - 止损价: ¥${item.stopLoss.toFixed(2)}`);
          }
        }
        lines.push('');
      }

      lines.push('### 风控参数');
      lines.push('');
      lines.push(`- 最大持仓: ¥${review.tomorrowPlan.riskControl.maxPosition.toFixed(2)}`);
      lines.push(`- 止损比例: ${(review.tomorrowPlan.riskControl.stopLossRatio * 100).toFixed(1)}%`);
      lines.push('');

      if (review.tomorrowPlan.marketFocus) {
        lines.push(`**市场关注**: ${review.tomorrowPlan.marketFocus}`);
        lines.push('');
      }
    }

    // 8. 总结感悟
    if (review.summary) {
      lines.push('## 💭 总结感悟');
      lines.push('');
      lines.push(review.summary);
      lines.push('');
    }

    // 页脚
    lines.push('---');
    lines.push('');
    lines.push('*本复盘由 **龟迹复盘** 生成*');
    lines.push(`*复盘创建于: ${new Date(review.createdAt).toLocaleString('zh-CN')}*`);
    if (review.updatedAt !== review.createdAt) {
      lines.push(`*最后更新: ${new Date(review.updatedAt).toLocaleString('zh-CN')}*`);
    }

    return lines.join('\n');
  }

  /**
   * 导出复盘为PDF（通过浏览器打印）
   */
  async exportToPDF(date: string): Promise<void> {
    const markdown = await this.exportToMarkdown(date);
    if (!markdown) return;

    // 获取 logo 的 base64
    const logoBase64 = await this.getLogoBase64();

    // 创建新窗口显示内容并打印
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const logoHtml = logoBase64
      ? `<div style="text-align: center; margin-bottom: 20px;">
          <img src="${logoBase64}" alt="龟迹复盘" style="height: 50px; width: auto;" />
        </div>`
      : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>龟迹复盘 - 每日复盘 ${date}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
          }
          h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
          h2 { margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          h3 { margin-top: 20px; }
          table { border-collapse: collapse; width: 100%; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; }
          code { background-color: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
          hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
          .header { text-align: center; margin-bottom: 20px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 0.9em; }
          @media print {
            body { font-size: 12pt; }
            h1 { page-break-before: auto; }
            h2 { page-break-after: avoid; }
          }
        </style>
      </head>
      <body>
        ${logoHtml}
        <div class="header">
          <h1>龟迹复盘</h1>
          <p style="color: #666; margin-top: -10px;">每日复盘 - ${date}</p>
        </div>
        ${this.markdownToHtml(markdown)}
        <div class="footer">
          <p>本复盘由 <strong>龟迹复盘</strong> 生成</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();

    // 等待内容加载后打印
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }

  /**
   * 获取 logo 的 base64 编码
   */
  private async getLogoBase64(): Promise<string> {
    try {
      const response = await fetch('/src/assets/TurtleTraceLogo.png');
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error('Failed to load logo:', e);
      return '';
    }
  }

  /**
   * 简单的 Markdown 转 HTML
   */
  private markdownToHtml(markdown: string): string {
    let html = markdown;

    // 标题
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');

    // 粗体
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // 水平线
    html = html.replace(/^---$/gm, '<hr>');

    // 斜体
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // 代码
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');

    // 链接
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

    // 列表（简单处理）
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // 表格（简单处理）
    const lines = html.split('\n');
    let inTable = false;
    const processed: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('|') && line.includes('|')) {
        if (!inTable) {
          processed.push('<table>');
          inTable = true;
        }

        // 跳过分隔行
        if (line.includes('---')) {
          continue;
        }

        const cells = line.split('|').filter(c => c.trim());
        const isHeader = i > 0 && lines[i - 1].includes('---');
        const tag = isHeader ? 'td' : 'th';

        processed.push(`<tr>${cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('')}</tr>`);
      } else {
        if (inTable) {
          processed.push('</table>');
          inTable = false;
        }
        processed.push(line);
      }
    }

    if (inTable) {
      processed.push('</table>');
    }

    html = processed.join('\n');

    // 段落处理
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';

    return html;
  }
}

// 单例导出
export const reviewService = new ReviewService();
