import type { WeeklyReview } from '../types/weeklyReview';
import { getWeekRange, getCurrentWeekLabel } from '../types/weeklyReview';

const WEEKLY_REVIEWS_STORAGE_KEY = 'stock_app_weekly_reviews';

/**
 * 每周复盘服务
 * 提供周复盘记录的增删改查、初始化和导出功能
 */
class WeeklyReviewService {
  /**
   * 获取指定周的复盘
   */
  async getReview(weekLabel: string): Promise<WeeklyReview | null> {
    try {
      const reviews = await this.getAllReviews();
      return reviews.find(r => r.weekLabel === weekLabel) || null;
    } catch (error) {
      console.error('获取周复盘失败:', error);
      return null;
    }
  }

  /**
   * 保存周复盘
   */
  async saveReview(review: WeeklyReview): Promise<boolean> {
    try {
      const reviews = await this.getAllReviews();
      const existingIndex = reviews.findIndex(r => r.weekLabel === review.weekLabel);

      if (existingIndex >= 0) {
        reviews[existingIndex] = { ...review, updatedAt: Date.now() };
      } else {
        reviews.push(review);
      }

      reviews.sort((a, b) => b.weekLabel.localeCompare(a.weekLabel));
      localStorage.setItem(WEEKLY_REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
      return true;
    } catch (error) {
      console.error('保存周复盘失败:', error);
      return false;
    }
  }

  /**
   * 获取所有周复盘记录
   */
  async getAllReviews(): Promise<WeeklyReview[]> {
    try {
      const data = localStorage.getItem(WEEKLY_REVIEWS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('获取周复盘列表失败:', error);
      return [];
    }
  }

  /**
   * 获取指定年份的周复盘列表
   */
  async getReviewsByYear(year: number): Promise<WeeklyReview[]> {
    try {
      const reviews = await this.getAllReviews();
      return reviews.filter(r => r.weekLabel.startsWith(`${year}-`));
    } catch (error) {
      console.error('获取年度周复盘失败:', error);
      return [];
    }
  }

  /**
   * 删除周复盘
   */
  async deleteReview(weekLabel: string): Promise<boolean> {
    try {
      const reviews = await this.getAllReviews();
      const filtered = reviews.filter(r => r.weekLabel !== weekLabel);
      localStorage.setItem(WEEKLY_REVIEWS_STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('删除周复盘失败:', error);
      return false;
    }
  }

  /**
   * 初始化周复盘
   */
  async initializeWeekReview(weekLabel?: string): Promise<WeeklyReview> {
    const targetWeek = weekLabel || getCurrentWeekLabel();
    const existing = await this.getReview(targetWeek);
    if (existing) return existing;

    const range = getWeekRange(targetWeek);
    const now = Date.now();
    const review: WeeklyReview = {
      id: targetWeek,
      weekLabel: targetWeek,
      startDate: range.startDate,
      endDate: range.endDate,
      createdAt: now,
      updatedAt: now,
    };

    return review;
  }

  /**
   * 导出周复盘为Markdown
   */
  async exportToMarkdown(weekLabel: string): Promise<string> {
    const review = await this.getReview(weekLabel);
    if (!review) return '';

    const lines: string[] = [];

    lines.push(`# 股票每周复盘 - ${review.weekLabel}`);
    lines.push(`**时间范围**: ${review.startDate} ~ ${review.endDate}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    // 一、本周核心目标回顾
    if (review.coreGoals) {
      lines.push('## 一、本周核心目标回顾');
      lines.push('');

      lines.push('**本周重点布局的主线板块（1~2个）**');
      review.coreGoals.mainSectors.forEach(sector => {
        lines.push(`> ${sector}`);
      });
      lines.push('');

      if (review.coreGoals.coreLogic) {
        lines.push('**当初选择该主线的核心逻辑**');
        lines.push(`> ${review.coreGoals.coreLogic}`);
        lines.push('');
      }
    }

    // 二、本周成果评估
    if (review.achievements) {
      lines.push('## 二、本周成果评估');
      lines.push('');

      lines.push('| 维度 | 内容 |');
      lines.push('|------|------|');

      const ach = review.achievements;
      const shanghaiChange = ach.marketPerformance.shanghaiChange >= 0
        ? `+${ach.marketPerformance.shanghaiChange.toFixed(2)}%`
        : `${ach.marketPerformance.shanghaiChange.toFixed(2)}%`;
      const chinextChange = ach.marketPerformance.chinextChange >= 0
        ? `+${ach.marketPerformance.chinextChange.toFixed(2)}%`
        : `${ach.marketPerformance.chinextChange.toFixed(2)}%`;

      lines.push(`| 大盘表现 | 上证: ${shanghaiChange}，创业板: ${chinextChange} |`);

      const sectorChange = ach.sectorPerformance.sectorChange >= 0 ? '+' : '';
      lines.push(`| 主线板块收益 | ${sectorChange}${ach.sectorPerformance.sectorChange.toFixed(2)}% vs 大盘 ${ach.marketPerformance.shanghaiChange >= 0 ? '+' : ''}${ach.marketPerformance.shanghaiChange.toFixed(2)}% |`);

      if (ach.sectorPerformance.outperformance !== 0) {
        const outperf = ach.sectorPerformance.outperformance >= 0 ? '+' : '';
        lines.push(`| 跑赢大盘 | ${outperf}${ach.sectorPerformance.outperformance.toFixed(2)}% |`);
      }

      lines.push('');

      lines.push('**个股操作亮点**');
      ach.highlights.forEach(h => lines.push(`- ${h}`));
      lines.push('');

      lines.push('**个股操作槽点**');
      ach.lowlights.forEach(l => lines.push(`- ${l}`));
      lines.push('');

      lines.push('**数据统计**');
      lines.push(`- 主线仓位占比：${ach.mainSectorPosition.toFixed(1)}%`);
      const profitStr = ach.totalProfitLoss >= 0 ? `+${ach.totalProfitLoss.toFixed(2)}%` : `${ach.totalProfitLoss.toFixed(2)}%`;
      lines.push(`- 总体盈亏：${profitStr}`);
      lines.push(`- 胜率：${ach.winRate.toFixed(1)}%`);
      lines.push('');
    }

    // 三、资源投入分析
    if (review.resourceAnalysis) {
      lines.push('## 三、资源投入分析（资金 & 精力）');
      lines.push('');

      const res = review.resourceAnalysis;

      lines.push(`**资金是否集中在主线上？**`);
      lines.push(res.focusedOnMain ? '> □ 是（主线仓位 ≥60%）' : '> □ 否（分散在多个题材）');
      lines.push('');

      lines.push(`**是否过度关注非主线杂毛股？**`);
      lines.push(res.scatteredAttention ? '> □ 是（频繁切换、追小票）' : '> □ 否（聚焦核心）');
      lines.push('');

      const freqMap = {
        excessive: '过度交易',
        moderate: '适度',
        missed: '错失机会'
      };
      lines.push(`**操作频率是否合理？**`);
      lines.push(`> ${freqMap[res.tradingFrequency]}`);
      lines.push('');
    }

    // 四、关键信号与市场节奏判断
    if (review.marketRhythm) {
      lines.push('## 四、关键信号与市场节奏判断');
      lines.push('');

      const mr = review.marketRhythm;

      const cycleMap: Record<string, string> = {
        startup: '启动期',
        main_rise: '主升期',
        climax: '高潮期',
        divergence: '分歧期',
        retreat: '退潮期'
      };

      lines.push(`**本周情绪周期阶段**`);
      lines.push(`> ${cycleMap[mr.emotionCycle] || mr.emotionCycle}`);
      lines.push('');

      if (mr.keySignals.length > 0) {
        lines.push('**核心验证信号**');
        mr.keySignals.forEach(s => lines.push(`> ${s}`));
        lines.push('');
      }

      lines.push('**市场信号**');
      lines.push(`- 北向资金：${mr.northwardFunds}`);
      lines.push(`- 量能：${mr.volume}`);
      lines.push(`- 涨停家数：${mr.limitUpCount}`);
      lines.push('');
    }

    // 五、下周核心策略制定
    if (review.nextWeekStrategy) {
      lines.push('## 五、下周核心策略制定');
      lines.push('');

      const nws = review.nextWeekStrategy;

      lines.push('**唯一聚焦主线（不贪多）**');
      lines.push(`> ${nws.mainSector}`);
      lines.push('');

      if (nws.catalystEvents.length > 0) {
        lines.push('**潜在杠杆事件（可能引爆板块的关键催化剂）**');
        nws.catalystEvents.forEach(e => lines.push(`> ${e}`));
        lines.push('');
      }

      lines.push('**仓位管理计划**');
      lines.push(`- 情绪主升期：${nws.positionPlan.mainRise}`);
      lines.push(`- 分歧/退潮期：${nws.positionPlan.divergence}`);
      lines.push('');

      if (nws.focusTargets.length > 0) {
        lines.push('**重点关注标的（≤3只，必须是主线核心）**');
        nws.focusTargets.forEach((t, i) => {
          lines.push(`${i + 1}. **${t.name}** (${t.symbol})`);
          lines.push(`   - 逻辑：${t.logic}`);
        });
        lines.push('');
      }

      lines.push('**风控底线**');
      lines.push(`- 单票最大亏损容忍：${nws.riskControl.maxSingleLoss.toFixed(1)}%`);
      lines.push(`- 若主线退潮（如龙头跌停+中位股崩塌），立即减仓至${nws.riskControl.retreatPosition}成`);
      lines.push('');
    }

    // 六、本周最大认知收获
    if (review.keyInsight) {
      lines.push('## 六、本周最大认知收获（1句话总结）');
      lines.push('');
      lines.push(`> ${review.keyInsight}`);
      lines.push('');
    }

    // 页脚
    lines.push('---');
    lines.push('');
    lines.push('**复盘避坑提醒**');
    lines.push('- 不用情绪词：不说"运气差"，要说"未设止损导致回撤扩大"');
    lines.push('- 结论要可执行：每条反思必须转化为下一周的具体规则');
    lines.push('- 聚焦自身模式：你是做波段还是打板？只复盘与你模式相关的部分');
    lines.push('');
    lines.push('*本复盘由 **龟迹复盘** 生成*');
    lines.push(`*复盘创建于: ${new Date(review.createdAt).toLocaleString('zh-CN')}*`);
    if (review.updatedAt !== review.createdAt) {
      lines.push(`*最后更新: ${new Date(review.updatedAt).toLocaleString('zh-CN')}*`);
    }

    return lines.join('\n');
  }

  /**
   * 导出周复盘为PDF（通过浏览器打印）
   */
  async exportToPDF(weekLabel: string): Promise<void> {
    const markdown = await this.exportToMarkdown(weekLabel);
    if (!markdown) return;

    const review = await this.getReview(weekLabel);
    if (!review) return;

    // 获取 logo 的 base64
    const logoBase64 = await this.getLogoBase64();

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
        <title>龟迹复盘 - 每周复盘 ${weekLabel}</title>
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
          blockquote { border-left: 3px solid #ddd; padding-left: 15px; color: #666; margin: 10px 0; }
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
          <p style="color: #666; margin-top: -10px;">每周复盘 - ${weekLabel}</p>
          <p style="color: #999; font-size: 0.9em;">${review.startDate} ~ ${review.endDate}</p>
        </div>
        ${this.markdownToHtml(markdown)}
        <div class="footer">
          <p>本复盘由 <strong>龟迹复盘</strong> 生成</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();

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

    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/^---$/gm, '<hr>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

    // Blockquote
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

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
        if (line.includes('---')) continue;
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
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';

    return html;
  }
}

export const weeklyReviewService = new WeeklyReviewService();
