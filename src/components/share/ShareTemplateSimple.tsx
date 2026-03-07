import React from 'react'
import type { ShareData, ShareConfig } from '../../types/share'
import { shareService } from '../../services/shareService'
import TurtleTraceLogo from '../../assets/TurtleTraceLogo.png'

interface ShareTemplateSimpleProps {
  data: ShareData
  config: ShareConfig
  width?: number
}

/**
 * 简约白模板 - 白底简洁排版，重点突出
 * 适用于朋友圈、微信群
 */
export const ShareTemplateSimple: React.FC<ShareTemplateSimpleProps> = ({
  data,
  config,
  width = 1080,
}) => {
  const { privacy, style } = config
  const { dailyReview, profitSummary } = data

  const date = dailyReview?.date || new Date().toISOString().split('T')[0]
  const watermark = style.customWatermark
    ? `🐢 龟迹复盘 | ${style.customWatermark}`
    : '🐢 龟迹复盘'

  // 格式化函数
  const formatPercent = (val: number) => shareService.formatPercent(val)
  const formatAmount = (val: number) => shareService.formatAmount(val, privacy)

  return (
    <div
      style={{
        width: `${width}px`,
        minHeight: '600px',
        backgroundColor: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        padding: '40px',
        boxSizing: 'border-box',
      }}
    >
      {/* 头部 */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: '32px',
          paddingBottom: '24px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
          {date}
        </div>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 600,
            color: '#1a1a1a',
            margin: 0,
          }}
        >
          每日复盘
        </h1>
      </div>

      {/* 市场数据 */}
      {config.modules.dailyReview && dailyReview?.marketData && (
        <div style={{ marginBottom: '32px' }}>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#333',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span style={{ marginRight: '8px' }}>📊</span> 市场数据
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
            }}
          >
            {dailyReview.marketData.indices.slice(0, 3).map((index, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                  {index.name}
                </div>
                <div
                  style={{
                    fontSize: '20px',
                    fontWeight: 600,
                    color: index.change >= 0 ? '#e74c3c' : '#2ecc71',
                  }}
                >
                  {formatPercent(index.change)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 持仓表现 */}
      {config.modules.dailyReview && dailyReview?.positionData && (
        <div style={{ marginBottom: '32px' }}>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#333',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span style={{ marginRight: '8px' }}>💰</span> 持仓表现
          </h2>

          {/* 当日盈亏汇总 */}
          <div
            style={{
              backgroundColor:
                dailyReview.positionData.dailySummary.totalProfit >= 0
                  ? '#fff5f5'
                  : '#f0fff4',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
              当日盈亏
            </div>
            <div
              style={{
                fontSize: '36px',
                fontWeight: 700,
                color:
                  dailyReview.positionData.dailySummary.totalProfit >= 0
                    ? '#e74c3c'
                    : '#2ecc71',
              }}
            >
              {formatAmount(dailyReview.positionData.dailySummary.totalProfit)}
            </div>
            <div
              style={{
                fontSize: '14px',
                color:
                  dailyReview.positionData.dailySummary.totalProfit >= 0
                    ? '#e74c3c'
                    : '#2ecc71',
                marginTop: '4px',
              }}
            >
              盈利 {dailyReview.positionData.dailySummary.winCount} / 亏损{' '}
              {dailyReview.positionData.dailySummary.lossCount}
            </div>
          </div>

          {/* 持仓列表 */}
          {!privacy.hideAmount && dailyReview.positionData.positions.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {dailyReview.positionData.positions.slice(0, 5).map((pos, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    backgroundColor: '#fafafa',
                    borderRadius: '8px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 500, color: '#333' }}>{pos.name}</div>
                    {!privacy.hideStockCode && (
                      <div style={{ fontSize: '12px', color: '#999' }}>{pos.symbol}</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: pos.change >= 0 ? '#e74c3c' : '#2ecc71',
                      }}
                    >
                      {formatPercent(pos.change)}
                    </div>
                    {!privacy.percentOnly && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: pos.dailyProfit >= 0 ? '#e74c3c' : '#2ecc71',
                        }}
                      >
                        {formatAmount(pos.dailyProfit)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 收益统计 */}
      {config.modules.profitStats && profitSummary && (
        <div style={{ marginBottom: '32px' }}>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#333',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span style={{ marginRight: '8px' }}>📈</span> 累计收益
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
            }}
          >
            <div
              style={{
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                总市值
              </div>
              <div style={{ fontSize: '20px', fontWeight: 600, color: '#333' }}>
                {formatAmount(profitSummary.totalValue)}
              </div>
            </div>
            <div
              style={{
                backgroundColor:
                  profitSummary.totalProfit >= 0 ? '#fff5f5' : '#f0fff4',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                总收益率
              </div>
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: profitSummary.totalProfit >= 0 ? '#e74c3c' : '#2ecc71',
                }}
              >
                {formatPercent(profitSummary.totalProfitPercent)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 明日计划 */}
      {config.modules.dailyReview && dailyReview?.tomorrowPlan && (
        <div style={{ marginBottom: '32px' }}>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#333',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span style={{ marginRight: '8px' }}>💭</span> 明日计划
          </h2>
          <div
            style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              padding: '16px',
              fontSize: '14px',
              color: '#555',
              lineHeight: 1.6,
            }}
          >
            {dailyReview.tomorrowPlan.strategy}
          </div>
        </div>
      )}

      {/* 总结 */}
      {config.modules.dailyReview && dailyReview?.summary && (
        <div style={{ marginBottom: '32px' }}>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#333',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span style={{ marginRight: '8px' }}>📌</span> 今日总结
          </h2>
          <div
            style={{
              fontSize: '14px',
              color: '#555',
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap',
            }}
          >
            {dailyReview.summary}
          </div>
        </div>
      )}

      {/* 水印 */}
      <div
        style={{
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '1px solid #f0f0f0',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <img
            src={TurtleTraceLogo}
            alt="龟迹复盘"
            style={{ height: '28px', width: 'auto' }}
          />
          <span style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>龟迹复盘</span>
          {style.customWatermark && (
            <span style={{ fontSize: '12px', color: '#bbb' }}>| {style.customWatermark}</span>
          )}
        </div>
        <div style={{ fontSize: '12px', color: '#bbb' }}>
          {date}
        </div>
      </div>
    </div>
  )
}
