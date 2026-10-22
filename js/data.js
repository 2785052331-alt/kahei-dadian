/* 开黑点单 H5 demo 数据（无后端，本地演示）
   合规口径：服务方式=老板本人操作账号；不承诺游戏内收益与段位变化；不收集账号密码。
   字段位 guarantee/compensate/online_mode 保留但不渲染，后续如需对标版再开。 */
window.DATA = {
  /* 平台费率（写进招募页与订单，做透明分成） */
  rates: { platform: 15, mate: 85 },

  games: [
    { id: 1, name: '三角洲', icon: '△' },
    { id: 2, name: '暗区', icon: '▣', hot: '热' },
    { id: 3, name: '无畏', icon: '◈' },
    { id: 4, name: '王者', icon: '◉' },
    { id: 5, name: '上新', icon: '＋', soon: true }
  ],

  moreGames: ['永劫', '金铲铲', '第五', '和平', '更多'],

  goods: [
    {
      id: 101, game: 1, cover: '指挥单', group: ['夜猫'],
      title: '长弓 · 3 小时战术指挥陪玩',
      unit: '元 / 3小时', price: 99, origin: 138,
      tags: ['不满意补 1 把', '语音指挥', '21:00-02:00'],
      seckill: { sold: 62 },
      fields: [
        ['服务方式', '老板本人操作账号，指挥全程语音陪同'],
        ['服务时长', '3 小时（约 5-7 局，按局数封顶）'],
        ['指挥水平', '段位核验通过 · 好评率 99.2%'],
        ['服务时段', '21:00 - 次日 02:00（可预约）'],
        ['备注', '提交后 10 分钟内派单，超时自动取消'],
        ['说明', '不承诺游戏内收益与段位变化']
      ],
      notice: '需成年实名。服务全程在老板自己账号内进行，本站不收集游戏账号密码。如对服务不满意，可在待验收阶段申请补单或退款（原路退回）。',
      shots: ['指挥站位图', '局后复盘表', '战绩截图']
    },
    {
      id: 102, game: 1, cover: '体验单', group: ['新客'],
      title: '首次体验 · 1 局指挥 + 图文复盘',
      unit: '元 / 把', price: 25, origin: 0,
      tags: ['老板本人上号', '局后复盘'],
      limit: 1,
      fields: [
        ['服务方式', '老板本人操作账号'],
        ['服务内容', '1 局指挥 + 图文复盘（约 300 字）'],
        ['指挥水平', '钻石及以上'],
        ['服务时段', '19:00 - 24:00'],
        ['说明', '不承诺游戏内收益']
      ],
      notice: '新客每人限 1 单，用于体验指挥风格。',
      shots: ['复盘示例', '站位示意']
    },
    {
      id: 103, game: 1, cover: '打包', group: ['夜猫'],
      title: '深夜战术陪玩 · 5 把打包（可分两晚）',
      unit: '元 / 5把', price: 119, origin: 165,
      tags: ['效率指挥', '22:00-02:00', '可 split'],
      seckill: { sold: 34 },
      fields: [
        ['服务方式', '老板本人操作账号'],
        ['服务内容', '5 局指挥，可分两个晚上使用'],
        ['有效期', '下单后 7 天内'],
        ['备注', '预约制，提前 30 分钟联系客服']
      ],
      notice: '未在有效期内使用的局数自动作废，不支持折现。',
      shots: ['路线图', '装备建议', '对局数据']
    },
    {
      id: 201, game: 2, cover: '带练', group: ['全部'],
      title: '暗区突围 · 跑图路线带练 2 小时',
      unit: '元 / 2小时', price: 66, origin: 88,
      tags: ['路线教学', '全程开麦'],
      fields: [
        ['服务方式', '老板本人操作账号'],
        ['服务内容', '跑图路线 + 装备策略 + 撤离点讲解'],
        ['指挥水平', '暗区顶尖段位']
      ],
      notice: '不承诺带出物资数量。',
      shots: ['路线示意']
    },
    {
      id: 301, game: 3, cover: '娱乐', group: ['全部'],
      title: '无畏契约 · 娱乐陪 1 局',
      unit: '元 / 局', price: 15, origin: 0,
      tags: ['娱乐陪', '有语音'],
      fields: [['服务内容', '陪同对局，以娱乐为主，不做强度承诺']],
      notice: '',
      shots: []
    },
    {
      id: 401, game: 4, cover: '娱乐', group: ['全部'],
      title: '王者荣耀 · 娱乐陪 1 小时',
      unit: '元 / 小时', price: 19, origin: 0,
      tags: ['娱乐陪', '脾气好'],
      fields: [['服务内容', '排位/匹配陪同，不承诺段位变化']],
      notice: '',
      shots: []
    }
  ],

  mates: [
    { id: 1, code: 'A-2041', nick: '夜航', gender: '男', age: 21, type: '技术指挥', game: '三角洲', gameKey: 1, rank: '钻石', served: 128, rate: '99%', from: 25, online: '在线', tags: ['开麦', '复盘报告'], video: '5″', min: 30, max: 60 },
    { id: 2, code: 'A-1177', nick: '潮汐', gender: '女', age: 20, type: '娱乐陪', game: '王者', gameKey: 4, rank: '星耀', served: 63, rate: '100%', from: 19, online: '接单中', tags: ['脾气好', '有语音'], video: '8″', min: 20, max: 40 },
    { id: 3, code: 'A-0932', nick: '岩枭', gender: '男', age: 23, type: '技术指挥', game: '暗区', gameKey: 2, rank: '顶尖', served: 212, rate: '98%', from: 33, online: '在线', tags: ['路线大师', '开麦'], video: '12″', min: 45, max: 80 },
    { id: 4, code: 'A-2288', nick: '白鸦', gender: '男', age: 25, type: '技术指挥', game: '三角洲', gameKey: 1, rank: '战神', served: 341, rate: '99.5%', from: 39, online: '在线', tags: ['枪械教学', '对局复盘'], video: '15″', min: 60, max: 120 },
    { id: 5, code: 'A-0615', nick: '萤', gender: '女', age: 19, type: '娱乐陪', game: '无畏', gameKey: 3, rank: '不朽', served: 27, rate: '100%', from: 15, online: '休息', tags: ['有语音', '新手友好'], video: '6″', min: 15, max: 30 }
  ],

  /* 指挥端：抢单大厅 */
  grabs: [
    { gid: 101, qty: 1, want: '今晚 21:30 · 想打长弓', budget: 99 },
    { gid: 103, qty: 1, want: '分两晚，5 把打包', budget: 119 },
    { gid: 102, qty: 1, want: '第一次体验，想学站位', budget: 25 }
  ]
};
