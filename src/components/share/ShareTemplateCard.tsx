import React from 'react'
import type { ShareData, ShareConfig } from '../../types/share'
import { shareService } from '../../services/shareService'
import TurtleTraceLogo from '../../assets/TurtleTraceLogo.png'

interface ShareTemplateCardProps {
  data: ShareData
  config: ShareConfig
  width?: number
}

/**
 * 卡片风模板 - 圆角卡片、阴影层次、现代感
 * 适用于小红书、社交媒体
 */
export const ShareTemplateCard: React.FC<ShareTemplateCardProps> = ({
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        padding: '40px',
        boxSizing: 'border-box',
      }}
    >
      {/* 主卡片容器 */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* 头部区域 */}
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '32px 40px',
            color: '#ffffff',
          }}
        >
          <div
            style={{
              fontSize: '14px',
              opacity: 0.8,
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
            {date}
          </div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              margin: 0,
              letterSpacing: '1px',
            }}
          >
            每日复盘
          </h1>
        </div>

        {/* 内容区域 */}
        <div style={{ padding: '32px 40px' }}>
          {/* 市场数据卡片 */}
          {config.modules.dailyReview && dailyReview?.marketData && (
            <div style={{ marginBottom: '28px' }}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#667eea',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '12px',
                }}
              >
                📊 市场数据
              </div>
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
                      background: index.change >= 0 ? '#fff5f5' : '#f0fff4',
                      borderRadius: '12px',
                      padding: '16px 12px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>
                      {index.name}
                    </div>
                    <div
                      style={{
                        fontSize: '18px',
                        fontWeight: 700,
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

          {/* 当日盈亏卡片 */}
          {config.modules.dailyReview && dailyReview?.positionData && (
            <div style={{ marginBottom: '28px' }}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#667eea',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '12px',
                }}
              >
                💰 今日盈亏
              </div>
              <div
                style={{
                  background:
                    dailyReview.positionData.dailySummary.totalProfit >= 0
                      ? 'linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%)'
                      : 'linear-gradient(135deg, #f0fff4 0%, #e8f5e9 100%)',
                  borderRadius: '16px',
                  padding: '24px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '40px',
                    fontWeight: 800,
                    color:
                      dailyReview.positionData.dailySummary.totalProfit >= 0
                        ? '#e74c3c'
                        : '#2ecc71',
                    marginBottom: '8px',
                  }}
                >
                  {formatAmount(dailyReview.positionData.dailySummary.totalProfit)}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '24px',
                    fontSize: '14px',
                    color: '#666',
                  }}
                >
                  <span>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#e74c3c',
                        marginRight: '6px',
                      }}
                    />
                    盈利 {dailyReview.positionData.dailySummary.winCount}
                  </span>
                  <span>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#2ecc71',
                        marginRight: '6px',
                      }}
                    />
                    亏损 {dailyReview.positionData.dailySummary.lossCount}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 持仓列表 */}
          {config.modules.dailyReview &&
            dailyReview?.positionData &&
            !privacy.hideAmount &&
            dailyReview.positionData.positions.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#667eea',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '12px',
                  }}
                >
                  📋 持仓明细
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {dailyReview.positionData.positions.slice(0, 4).map((pos, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '14px 18px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '14px',
                          }}
                        >
                          {pos.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#333', fontSize: '15px' }}>
                            {pos.name}
                          </div>
                          {!privacy.hideStockCode && (
                            <div style={{ fontSize: '12px', color: '#999' }}>
                              {pos.symbol}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '16px',
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
              </div>
            )}

          {/* 累计收益 */}
          {config.modules.profitStats && profitSummary && (
            <div style={{ marginBottom: '28px' }}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#667eea',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '12px',
                }}
              >
                📈 累计收益
              </div>
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
                    borderRadius: '12px',
                    padding: '18px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>
                    总市值
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#333' }}>
                    {formatAmount(profitSummary.totalValue)}
                  </div>
                </div>
                <div
                  style={{
                    background:
                      profitSummary.totalProfit >= 0
                        ? 'linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%)'
                        : 'linear-gradient(135deg, #f0fff4 0%, #e8f5e9 100%)',
                    borderRadius: '12px',
                    padding: '18px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>
                    总收益率
                  </div>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
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
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#667eea',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '12px',
                }}
              >
                💭 明日计划
              </div>
              <div
                style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '12px',
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
        </div>

        {/* 底部水印 */}
        <div
          style={{
            padding: '20px 40px',
            borderTop: '1px solid #f0f0f0',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
            <img
              src={TurtleTraceLogo}
              alt="龟迹复盘"
              style={{ height: '24px', width: 'auto' }}
            />
            <span style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>龟迹复盘</span>
            {style.customWatermark && (
              <span style={{ fontSize: '12px', color: '#bbb' }}>| {style.customWatermark}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
