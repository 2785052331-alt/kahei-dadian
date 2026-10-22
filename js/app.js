/* 开黑点单 H5 · 路由与交互（无后端，localStorage 存单） */
(function () {
  'use strict';
  var D = window.DATA;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var view = $('#view'), mask = $('#mask'), sheet = $('#sheet'), toast = $('#toast');
  var K = { order: 'kh_orders', uid: 'kh_uid', fav: 'kh_fav', mate: 'kh_mate' };

  /* ---------- 存储 ---------- */
  function ls(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function save(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  function uid() { var u = localStorage.getItem(K.uid); if (!u) { u = 'B' + Date.now().toString().slice(-6); localStorage.setItem(K.uid, u); } return u; }
  function orders() { return ls(K.order, []); }
  function ST(o) { o.status = ST_next(o.status); save(K.order, o.list || undefined); }

  var STATUS = { pending: '待派单', accepted: '待开始', serving: '服务中', to_verify: '待验收', done: '已完成', closed: '已取消' };
  var ZONE = ['QQ安卓', 'QQ苹果', '微信安卓', '微信苹果'];
  var NEXT = { pending: 'accepted', accepted: 'serving', serving: 'to_verify', to_verify: 'done' };
  var ACTION = { accepted: '指挥已开始', serving: '指挥结束服务', to_verify: '验收通过' };

  function addOrder(o) {
    var list = orders();
    o.no = 'Y' + Date.now().toString().slice(-8);
    o.status = 'pending';
    o.created = new Date().toLocaleString('zh-CN', { hour12: false });
    o.mate = o.mate || null;
    list.unshift(o); save(K.order, list);
    updateCart();
    return o;
  }
  function setOrder(no, patch) {
    var list = orders(), hit = null;
    list.forEach(function (x) { if (x.no === no) { hit = x; Object.keys(patch).forEach(function (k) { x[k] = patch[k]; }); } });
    save(K.order, list); updateCart(); return hit;
  }
  function updateCart() { $('#cartCount').textContent = orders().filter(function (o) { return o.status !== 'closed' && o.status !== 'done'; }).length; }

  /* ---------- 通用 UI ---------- */
  function say(msg, ms) {
    toast.hidden = false; toast.textContent = msg;
    clearTimeout(say.t); say.t = setTimeout(function () { toast.hidden = true; }, ms || 2200);
  }
  function openSheet(html) {
    sheet.innerHTML = html; sheet.hidden = false; mask.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeSheet() { sheet.hidden = true; mask.hidden = true; document.body.style.overflow = ''; }
  mask.addEventListener('click', closeSheet);

  function goodsCard(g) {
    var chg = g.tags.map(function (t, i) { return '<span class="chip' + (i === 0 ? ' gold' : '') + '">' + t + '</span>'; }).join('');
    return '<div class="goods" data-go="#/goods/' + g.id + '">' +
      '<div class="thumb"><span>' + g.cover + '</span></div>' +
      '<div class="info"><h3>' + g.title + '</h3><div>' + chg + '</div>' +
      (g.seckill ? '<div class="meter"><i style="width:' + g.seckill.sold + '%"></i></div>' : '') +
      '<div class="between"><div class="price"><i>¥</i><b>' + g.price + '</b>' +
      (g.origin ? '<u>¥' + g.origin + '</u>' : '') +
      '<span class="mini" style="margin-left:6px;color:var(--dim)">' + g.unit + '</span></div>' +
      '<button class="buy">下单</button></div>' +
      (g.seckill ? '<div class="cd" data-cd>⏱ 闪团剩余 <b class="cdnum">06:00:00</b> · 已抢 ' + g.seckill.sold + '%</div>' : '') +
      '</div></div>';
  }

  /* 倒计时（页面级，切换路由时清除） */
  var timers = [];
  function startCountdown() {
    timers.forEach(clearInterval); timers = [];
    var ends = {};
    function pad(n) { return String(n).padStart(2, '0'); }
    var t = setInterval(function () {
      var left = Math.max(0, ends.remain--);
      var txt = pad(Math.floor(left / 3600)) + ':' + pad(Math.floor(left % 3600 / 60)) + ':' + pad(left % 60);
      Array.prototype.forEach.call(document.querySelectorAll('[data-cd] .cdnum'), function (el) { el.textContent = txt; });
    }, 1000);
    timers.push(t);
    // 首个带闪团的商品决定剩余时间
    var first = D.goods.filter(function (g) { return g.seckill; })[0];
    ends.remain = first ? 5 * 3600 + 42 * 60 + 11 : 0;
  }
  function stopTimers() { timers.forEach(clearInterval); timers = []; }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('[data-go]') : null;
    if (a) { location.hash = a.getAttribute('data-go'); }
  });

  /* ---------- 客服 ---------- */
  function cs(orderNo) {
    openSheet('<div class="between"><b class="h2">联系客服</b><span class="sub" id="csX">关闭 ✕</span></div>' +
      '<div class="card2" style="margin:12px 0;color:var(--dim);font-size:11px">demo 提示：正式版此处接微信客服 / 企业微信，分流「商品咨询」与「订单处理」。</div>' +
      (orderNo ? '<div class="fields"><div class="f"><span class="k">当前单号</span><span class="v">' + orderNo + '</span></div></div>' : '') +
      '<div class="fields">' +
      '<div class="f"><span class="k">我的编号</span><span class="v">' + uid() + '</span></div>' +
      '<div class="f"><span class="k">服务时间</span><span class="v">7×24（夜猫档 21:00-02:00 优先）</span></div>' +
      '<div class="f"><span class="k">处理时效</span><span class="v">订单问题 10 分钟内响应，超时自动取消并退款</span></div>' +
      '</div>' +
      '<button class="btn block" id="csCopy">复制我的编号发给客服</button>');
    $('#csX').onclick = closeSheet;
    $('#csCopy').onclick = function () {
      var ta = document.createElement('textarea'); ta.value = uid(); document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); say('已复制编号 ' + uid()); } catch (err) { say('复制失败，请手动记录：' + uid()); }
      document.body.removeChild(ta);
    };
  }
  $('#csFab').onclick = function () { cs(); };

  /* ---------- 下单抽屉 ---------- */
  var cur = { qty: 1, goods: null, mate: null };
  function orderSheet(g, mateId) {
    if (!g) return;
    cur = { qty: 1, goods: g, mate: mateId || null };
    var mate = mateId ? D.mates.filter(function (m) { return m.id === mateId; })[0] : null;
    openSheet(
      '<div class="between"><b class="h2">提交预约单</b><span class="sub" id="oX">关闭 ✕</span></div>' +
      '<div class="card2" style="margin:12px 0;color:#ff8a6b;font-size:11px">H5 demo 未接入支付：提交后只生成预约记录。正式版流程 = 微信支付（服务商分账）→ 10 分钟内派单 → 指挥开始服务 → 你验收。</div>' +
      '<div class="fields">' +
      '<div class="f"><span class="k">项目</span><span class="v">' + g.title + '</span></div>' +
      '<div class="f"><span class="k">计价</span><span class="v">¥' + g.price + ' / ' + g.unit.replace(/^元\s*\/\s*/, '') + '</span></div>' +
      (mate ? '<div class="f"><span class="k">指定指挥</span><span class="v">' + mate.nick + '（' + mate.code + '）</span></div>' : '<div class="f"><span class="k">派单</span><span class="v">系统智能匹配（可指定指挥）</span></div>') +
      '</div>' +
      '<div class="zonebox"><span class="zl">区服</span>' + ZONE.map(function (z, i) {
        return '<span class="chip pick zone' + (i === 0 ? ' on' : '') + '" data-zone="' + z + '">' + z + '</span>';
      }).join('') + '</div>' +
      '<div class="fld"><span class="k">角色ID</span><input id="f_role" placeholder="游戏内角色ID（选填）"></div>' +
      '<div class="fld"><span class="k">游戏ID</span><input id="f_uid" placeholder="只填昵称/ID，本站不收账号密码"></div>' +
      '<div class="card2" style="margin:8px 0;text-align:center"><div class="mini">可上传 3 张游戏内个人信息截图供指挥核对 · 0/3（demo 未接存储）</div></div>' +
      '<div class="fld"><span class="k">期望时段</span><input id="f_at" placeholder="如 今晚 21:30"></div>' +
      '<div class="fld"><span class="k">份数</span><div class="step"><button id="oMinus">−</button><b id="oQty" style="min-width:22px;text-align:center">1</b><button id="oPlus">＋</button></div>' +
      '<span class="sp"></span><span class="price"><i>¥</i><b id="oTotal">' + g.price.toFixed(2) + '</b></span></div>' +
      '<div class="fld" style="border-bottom:0"><span class="k">备注</span><textarea id="f_note" rows="2" placeholder="想打哪张图 / 想练什么 / 有无队友"></textarea></div>' +
      '<div class="between" style="margin:10px 0 6px"><span class="sub">合计金额</span><span class="price"><i>¥</i><b style="font-size:26px" id="oTotal2">' + g.price.toFixed(2) + '</b></span></div>' +
      '<div class="notice" style="margin-top:8px"><b>下单须知</b>：' + (g.notice || '需成年实名；服务在老板本人账号内进行；不承诺游戏内收益与段位变化。') + '</div>' +
      '<div class="mini" style="color:#ff8a6b;margin-bottom:10px">⚠️ 同行普遍在下单页收集「游戏密码」用于上号代打。本站不提供该字段：需要核对身份时，请你本人上号后截图，或语音里现场确认。</div>' +
      '<button class="btn block" id="oGo">确认提交预约</button>');
    $('#oX').onclick = closeSheet;
    Array.prototype.forEach.call(sheet.querySelectorAll('[data-zone]'), function (el) {
      el.onclick = function () {
        Array.prototype.forEach.call(sheet.querySelectorAll('[data-zone]'), function (z) { z.classList.remove('on'); });
        el.classList.add('on'); cur.zone = el.getAttribute('data-zone');
      };
    });
    cur.zone = ZONE[0];
    $('#oPlus').onclick = function () { if (cur.qty < 9) { cur.qty++; syncQty(); } };
    $('#oMinus').onclick = function () { if (cur.qty > 1) { cur.qty--; syncQty(); } };
    function syncQty() {
      var t = (cur.goods.price * cur.qty).toFixed(2);
      $('#oQty').textContent = cur.qty; $('#oTotal').textContent = t; $('#oTotal2').textContent = t;
    }
    $('#oGo').onclick = function () {
      var idv = $('#f_uid').value.trim();
      if (!idv) { say('请填写游戏昵称或 ID'); $('#f_uid').focus(); return; }
      var o = addOrder({
        gid: g.id, title: g.title, unit: g.unit, price: g.price, qty: cur.qty,
        amount: (g.price * cur.qty).toFixed(2),
        gameUid: idv, role: $('#f_role').value.trim(), zone: cur.zone, wantAt: $('#f_at').value.trim(),
        note: $('#f_note').value.trim(), mate: mate ? mate.nick + '（' + mate.code + '）' : null
      });
      closeSheet();
      openSheet('<div style="text-align:center;padding:10px 0 4px"><div class="tag" style="letter-spacing:4px">预约成功</div>' +
        '<div class="h1" style="margin:12px 0 4px">' + o.no + '</div>' +
        '<div class="sub">提交时间 ' + o.created + '</div>' +
        '<div class="qrbox">演示二维码</div>' +
        '<div class="card2" style="text-align:left;font-size:11.5px;color:var(--sub);line-height:1.9">' +
        '① 等待客服派单（正式版 10 分钟内自动派单）<br>② 指挥开始服务，你随时可在「我的」看进度<br>③ 服务结束由你验收，验收后指挥才结算</div>' +
        '<button class="btn block" style="margin-top:14px" id="pk2me">去看我的预约</button>' +
        '<button class="btn ghost block" style="margin-top:8px" id="pk2cs">联系客服</button></div>');
      $('#pk2me').onclick = function () { closeSheet(); location.hash = '#/me'; };
      $('#pk2cs').onclick = function () { closeSheet(); cs(o.no); };
    };
  }

  /* ---------- 视图 ---------- */
  var V = {};

  V.home = function () {
    var tabs = ['全部', '新客专享', '夜猫档'];
    return '<div class="hero"><span class="tag">战队招募</span>' +
      '<h2>能打的<em>都在这接单</em></h2>' +
      '<p>三角洲行动 / 暗区突围 / 王者荣耀 · 语音指挥陪玩</p>' +
      '<button class="btn sm" style="display:inline-block" data-go="#/join">申请成为指挥 ›</button>' +
      '<div class="trust"><i>实名成年</i><i>段位核验</i><i>不满意补 1 把</i><i>抽成透明 ' + D.rates.platform + '%</i></div></div>' +

      '<div class="card2 between" style="margin-bottom:14px"><span class="sub">指挥在线 <b class="gold">1 240</b> · 全天候接单</span><span class="sub">客服 7×24</span></div>' +

      '<div class="grid5">' + D.games.map(function (g, i) {
        return '<div class="g' + (i === 0 ? ' on' : '') + (g.soon ? ' soon' : '') + '"' + (g.hot ? ' data-hot>0' : '') + '>' +
          '<div class="ic">' + g.icon + '</div>' + g.name + (g.hot ? '<span class="hot">' + g.hot + '</span>' : '') + '</div>';
      }).join('') + '</div>' +

      '<div style="margin:16px 0 10px">' + tabs.map(function (t, i) {
        return '<span class="chip pick' + (i === 0 ? ' on' : '') + '" data-filter="' + i + '">' + t + '</span>';
      }).join('') + '</div>' +

      '<div class="sec"><b>限时闪团</b><a data-go="#/shelf">全部 ›</a></div>' +
      '<div id="list">' + D.goods.filter(function (g) { return g.seckill; }).map(goodsCard).join('') + '</div>' +

      '<div class="sec"><b>全部项目</b><a data-go="#/shelf">货架 ›</a></div>' +
      D.goods.map(goodsCard).join('') +

      '<div class="notice"><b>合规说明</b>：本站只提供语音陪玩与战术指挥服务，服务全程在老板本人账号内进行；' +
      '不代打、不承诺游戏内收益与段位变化、不收集游戏账号密码；未成年人禁止下单与接单。</div>';
  };

  V.shelf = function () {
    return '<div class="card2" style="margin-bottom:12px"><input id="kw" placeholder="🔍 搜项目名称 / 指挥编号" style="width:100%;background:transparent;border:0;color:var(--ink);outline:0;font:inherit"></div>' +
      '<div style="display:flex;gap:12px;align-items:flex-start">' +
      '<div style="width:84px;flex:none" id="side">' + D.games.map(function (g, i) {
        return '<div class="side' + (i === 0 ? ' side-on' : '') + '" data-game="' + g.id + '">' + g.name + '</div>';
      }).join('') + '</div>' +
      '<div style="flex:1;min-width:0" id="shelfList"></div></div>';
  };

  V.goods = function (id) {
    var g = D.goods.filter(function (x) { return String(x.id) === String(id); })[0] || D.goods[0];
    return '<div class="cover"><div class="big">' + g.cover + '</div><div class="s2">全程语音 · 局后复盘</div>' +
      '<div class="seal">不满意补 1 把</div><div class="cnt">1 / ' + Math.max(1, (g.shots || []).length + 1) + '</div></div>' +
      '<div class="h1" style="font-size:18px">' + g.title + '</div>' +
      '<div class="between" style="margin:10px 0">' +
      '<div class="price"><b>¥' + g.price + '</b>' + (g.origin ? '<u>原价 ¥' + g.origin + '</u>' : '') + '</div>' +
      '<span class="chip gold">' + g.unit + '</span></div>' +
      '<div>' + g.tags.map(function (t, i) { return '<span class="chip' + (i === 0 ? ' gold' : '') + '">' + t + '</span>'; }).join('') + '</div>' +
      '<div class="fields" style="margin-top:12px">' + g.fields.map(function (f) {
        return '<div class="f"><span class="k">' + f[0] + '</span><span class="v">' + f[1] + '</span></div>';
      }).join('') + '</div>' +
      (g.notice ? '<div class="notice"><b>下单须知</b>：' + g.notice + '</div>' : '') +
      '<div class="sec"><b>项目图文 / 战绩复盘</b><a>示例 ›</a></div>' +
      ((g.shots && g.shots.length) ? '<div class="shots">' + g.shots.map(function (s) { return '<div>' + s + '<br>（正式版由指挥上传）</div>'; }).join('') + '</div>'
        : '<div class="empty">该项目暂无战绩图</div>') +
      '<div class="sec"><b>可接指挥</b><a data-go="#/mates">大厅 ›</a></div>' +
      D.mates.filter(function (m) { return m.gameKey === g.game; }).map(function (m) {
        return '<div class="goods"><div class="ava"><span>▶ ' + m.video + '</span><b>' + m.online + '</b></div>' +
          '<div class="info"><h3>' + m.nick + ' <span class="mini">' + m.code + '</span></h3>' +
          '<div class="sub">' + m.gender + ' ' + m.age + ' · ' + m.type + ' · ' + m.rank + ' · 服务 ' + m.served + ' 单</div>' +
          '<div>' + m.tags.map(function (t) { return '<span class="chip">' + t + '</span>'; }).join('') + '<span class="chip gold">好评 ' + m.rate + '</span></div>' +
          '<div class="between" style="margin-top:6px"><div class="price"><i>¥</i><b>' + m.from + '</b><span class="mini" style="color:var(--dim)"> 起 / 把</span></div>' +
          '<button class="buy" data-assign="' + m.id + '">找 TA 开黑</button></div></div></div>';
      }).join('') +
      '<div class="actionbar">' +
      '<div class="mini-btn" data-poster="' + g.id + '"><i>▤</i>海报</div>' +
      '<div class="mini-btn" data-fav="' + g.id + '"><i>♡</i>收藏</div>' +
      '<button class="btn ghost sm" data-cs>先咨询</button>' +
      '<button class="btn" style="flex:1" data-order="' + g.id + '">立即下单</button></div>';
  };

  V.mates = function () {
    return '<div class="card2" style="margin-bottom:12px"><input id="mkw" placeholder="🔍 搜昵称或编号（如 A-2041）" style="width:100%;background:transparent;border:0;color:var(--ink);outline:0;font:inherit"></div>' +
      '<div class="grid5" style="margin-bottom:14px">' + D.games.concat(D.moreGames.slice(0, 0)).map(function (g, i) {
        return '<div class="g' + (i === 0 ? ' on' : '') + (g.soon ? ' soon' : '') + '" data-mgame="' + g.id + '"><div class="ic">' + g.icon + '</div>' + g.name + '</div>';
      }).join('') + '</div>' +
      '<div style="margin-bottom:12px"><span class="chip pick" data-type="娱乐陪">娱乐陪</span><span class="chip pick gold" data-type="">智能匹配</span><span class="chip pick" data-type="技术指挥">技术指挥</span></div>' +
      '<div class="sec"><b>在线指挥</b><a data-go="#/work">我要接单 ›</a></div>' +
      '<div id="mateList"></div>';
  };

  V.me = function () {
    var list = orders();
    return '<div class="card"><div class="between"><div><div class="h1" style="font-size:19px">我的</div>' +
      '<div class="sub" style="margin-top:4px">客户编号 ' + uid() + '</div></div><span class="tag">已成年实名</span></div>' +
      '<div style="height:1px;background:var(--line);margin:12px 0"></div>' +
      '<div class="row"><div class="sp" style="text-align:center"><div class="gold h2">' + list.length + '</div><div class="mini">预约单</div></div>' +
      '<div class="sp" style="text-align:center"><div class="gold h2">' + ls(K.fav, []).length + '</div><div class="mini">收藏</div></div>' +
      '<div class="sp" style="text-align:center"><div class="gold h2">¥0</div><div class="mini">余额</div></div></div></div>' +
      '<div class="sec"><b>预约记录</b><a id="clr">清空</a></div>' +
      (list.length ? list.map(function (o) {
        var next = NEXT[o.status];
        return '<div class="card order"><div class="between"><b style="font-size:14px">' + o.title + '</b>' +
          '<span class="st' + (o.status === 'closed' || o.status === 'done' ? ' off' : '') + '">' + STATUS[o.status] + '</span></div>' +
          '<div class="sub" style="margin:6rpx 0 6px 0">' + o.no + ' · ' + o.created + ' · ' + o.qty + ' 份' + (o.mate ? ' · 指定 ' + o.mate : '') + '</div>' +
          '<div class="fields" style="margin:8px 0 10px">' +
          '<div class="f"><span class="k">区服</span><span class="v">' + (o.zone || '-') + (o.role ? ' · 角色ID ' + o.role : '') + '</span></div>' +
          '<div class="f"><span class="k">游戏ID</span><span class="v">' + o.gameUid + '</span></div>' +
          (o.wantAt ? '<div class="f"><span class="k">期望时段</span><span class="v">' + o.wantAt + '</span></div>' : '') +
          (o.note ? '<div class="f"><span class="k">备注</span><span class="v">' + o.note + '</span></div>' : '') +
          '</div>' +
          '<div class="between"><div class="price"><i>¥</i><b>' + o.amount + '</b></div>' +
          '<div class="row" style="gap:8px">' +
          '<button class="btn ghost sm" data-csno="' + o.no + '">客服</button>' +
          (o.status === 'pending' ? '<button class="btn ghost sm" data-cancel="' + o.no + '">取消</button>' : '') +
          (next ? '<button class="btn sm" data-next="' + o.no + '">' + (ACTION[o.status] || '推进') + '</button>' : '') +
          '</div></div>' +
          (o.status === 'pending' ? '<div class="mini" style="margin-top:8px;color:var(--dim)">demo：点右侧按钮可模拟完整状态流转（正式版由派单与指挥端驱动）</div>' : '') +
          '</div>';
      }).join('') : '<div class="empty">还没有预约单，去首页下个体验单试试</div>') +
      '<div class="sec"><b>指挥入口</b></div>' +
      '<button class="btn ghost block" data-go="#/work">我是指挥 · 进入抢单端</button>';
  };

  V.join = function () {
    return '<div class="hero"><span class="tag">指挥招募</span><h2>能打的<em>都在这接单</em></h2>' +
      '<p>三角洲 / 暗区 / 无畏 / 王者 · 语音指挥与娱乐陪</p>' +
      '<div class="swatches"><i style="background:#0c0f14"></i><i style="background:#e8b64c"></i><i style="background:#f6d78a"></i><i style="background:#d9534f"></i></div>' +
      '</div>' +
      '<div class="fields"><div class="f"><span class="k">平台抽成</span><span class="v">' + D.rates.platform + '%（透明写进每张订单）</span></div>' +
      '<div class="f"><span class="k">指挥分成</span><span class="v">' + D.rates.mate + '%</span></div>' +
      '<div class="f"><span class="k">结算</span><span class="v">验收通过即可提现（正式版走微信服务商分账，平台不过手资金）</span></div>' +
      '<div class="f"><span class="k">硬性要求</span><span class="v">成年实名 · 段位截图核验 · 全程开麦</span></div></div>' +
      '<div class="notice"><b>接单红线</b>：不得索要或登录老板游戏账号；不得承诺游戏内收益、段位、物资产出；不得绕开平台私下交易。违者永久封禁并扣除未结算收益。</div>' +
      '<div class="fld"><span class="k">昵称</span><input id="jn" placeholder="游戏内昵称"></div>' +
      '<div class="fld"><span class="k">年龄</span><input id="ja" type="number" placeholder="需 ≥18"></div>' +
      '<div class="fld"><span class="k">主玩项目</span><select id="jg">' + D.games.filter(function (g) { return !g.soon; }).map(function (g) { return '<option>' + g.name + '</option>'; }).join('') + '</select></div>' +
      '<div class="fld"><span class="k">当前段位</span><input id="jr" placeholder="如 三角洲钻石 / 暗区顶尖"></div>' +
      '<div class="fld" style="border-bottom:0"><span class="k">时段</span><input id="jt" placeholder="如 21:00-02:00 可接"></div>' +
      '<div class="card2" style="text-align:center;margin:10px 0 12px"><div class="mini">段位截图 / 战绩凭证</div><div class="qrbox">点击上传<br>（demo 未接存储）</div></div>' +
      '<button class="btn block" id="joinGo">提交入驻申请</button>' +
      '<button class="btn ghost block" style="margin-top:8px" data-go="#/work">先看看抢单端长什么样</button>';
  };

  V.work = function () {
    return '<div class="card2 between" style="margin-bottom:12px"><span class="sub">指挥端 · 抢单大厅（demo）</span><span class="chip gold">我：夜航 A-2041</span></div>' +
      '<div class="sec"><b>待抢需求</b><a>刷新 ›</a></div>' +
      D.grabs.map(function (r, i) {
        var g = D.goods.filter(function (x) { return x.id === r.gid; })[0];
        var mine = (r.budget * D.rates.mate / 100).toFixed(2);
        return '<div class="card"><div class="between"><b class="h2" style="font-size:14px">' + g.title + '</b><span class="chip gold">' + r.qty + ' 份</span></div>' +
          '<div class="sub" style="margin:6px 0">老板需求：' + r.want + '</div>' +
          '<div class="fields"><div class="f"><span class="k">老板出价</span><span class="v">¥' + r.budget + '</span></div>' +
          '<div class="f"><span class="k">你可得</span><span class="v gold">¥' + mine + '（分成 ' + D.rates.mate + '%）</span></div>' +
          '<div class="f"><span class="k">要求时段</span><span class="v">今晚优先 · 需开麦</span></div></div>' +
          '<div class="row" style="gap:8px;margin-top:10px"><button class="btn ghost sm" data-cs>问清细节</button>' +
          '<button class="btn sm" style="flex:1" data-grab="' + i + '">语音抢单</button></div></div>';
      }).join('') +
      '<div class="sec"><b>我的收益（模拟）</b></div>' +
      '<div class="card"><div class="between"><span class="sub">待结算</span><b class="gold" id="pend">¥0</b></div>' +
      '<div class="between" style="margin-top:6px"><span class="sub">可提现</span><b class="gold">¥' + (ls(K.mate, []).reduce(function (s, x) { return s + x; }, 0)).toFixed(2) + '</b></div>' +
      '<div class="mini" style="margin-top:8px;color:var(--dim)">正式版：验收通过后自动分账到指挥微信零钱，平台只收 ' + D.rates.platform + '%。</div></div>' +
      '<button class="btn ghost block" data-go="#/me">返回老板端</button>';
};

  /* ---------- 渲染与事件 ---------- */
  function render() {
    stopTimers();
    var h = (location.hash || '#/home').split('/');
    var name = h[1] || 'home', arg = h[2];
    var fn = V[name] || V.home;
    view.innerHTML = fn(arg);
    document.title = ({ home: '开黑点单 · 三角洲战术陪玩点单站', shelf: '货架 · 开黑点单', goods: '项目详情 · 开黑点单', mates: '指挥大厅 · 开黑点单', me: '我的 · 开黑点单', join: '成为指挥 · 开黑点单', work: '指挥端 · 开黑点单' })[name] || '开黑点单';
    var tabMap = { home: 'home', shelf: 'shelf', goods: 'shelf', mates: 'mates', me: 'me', join: 'mates', work: 'mates' };
    Array.prototype.forEach.call(document.querySelectorAll('.tabbar a'), function (a) {
      a.classList.toggle('on', a.getAttribute('data-tab') === tabMap[name]);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.topnav a'), function (a) {
      a.classList.toggle('on', a.getAttribute('href') === '#' + name);
    });
    if (name === 'home') startCountdown();
    if (name === 'shelf') drawShelf('1', '');
    if (name === 'mates') drawMates('1', '', '');
    updateCart();
    window.scrollTo(0, 0);
  }

  function drawShelf(gameId, kw) {
    var box = $('#shelfList'); if (!box) return;
    var list = D.goods.filter(function (g) {
      var okG = !gameId || String(g.game) === String(gameId);
      var okK = !kw || (g.title + g.tags.join('')).toLowerCase().indexOf(kw.toLowerCase()) >= 0;
      return okG && okK;
    });
    box.innerHTML = list.length ? list.map(goodsCard).join('') : '<div class="empty">该分类暂无上架项目<br>试试别的分类或清空关键词</div>';
    if (kw) startCountdown();
  }
  function drawMates(gameKey, kw, type) {
    var box = $('#mateList'); if (!box) return;
    var list = D.mates.filter(function (m) {
      var okG = !gameKey || String(m.gameKey) === String(gameKey);
      var okK = !kw || (m.nick + m.code).indexOf(kw) >= 0;
      var okT = !type || m.type === type;
      return okG && okK && okT;
    });
    box.innerHTML = list.length ? list.map(function (m) {
      return '<div class="goods"><div class="ava"><span>▶ ' + m.video + '</span><b>' + m.online + '</b></div>' +
        '<div class="info"><h3>' + m.nick + ' <span class="mini">' + m.code + '</span> ' +
        '<span class="mini">' + m.gender + ' ' + m.age + '</span></h3>' +
        '<div class="sub">' + m.type + ' · ' + m.game + ' ' + m.rank + ' · 服务 ' + m.served + ' 单 · 可接 ' + m.min + '-' + m.max + ' 分钟</div>' +
        '<div>' + m.tags.map(function (t) { return '<span class="chip">' + t + '</span>'; }).join('') + '<span class="chip gold">好评 ' + m.rate + '</span></div>' +
        '<div class="between" style="margin-top:6px"><div class="price"><i>¥</i><b>' + m.from + '</b><span class="mini" style="color:var(--dim)"> 起 / 把</span></div>' +
        '<div class="row" style="gap:8px"><button class="btn ghost sm" data-cs>私聊</button>' +
        '<button class="btn sm" data-mate-order="' + m.id + '">找 TA 开黑</button></div></div></div></div>';
    }).join('') : '<div class="empty">该筛选下暂无在线指挥</div>';
  }

  /* 海报（canvas 生成，可下载） */
  function poster(id) {
    var g = D.goods.filter(function (x) { return String(x.id) === String(id); })[0];
    var c = document.createElement('canvas'); c.width = 600; c.height = 800;
    var x = c.getContext('2d');
    var grd = x.createLinearGradient(0, 0, 600, 800); grd.addColorStop(0, '#1d2735'); grd.addColorStop(1, '#0d1218');
    x.fillStyle = grd; x.fillRect(0, 0, 600, 800);
    x.strokeStyle = '#28303c'; x.lineWidth = 2; x.strokeRect(18, 18, 564, 764);
    x.fillStyle = '#e8b64c'; x.font = 'bold 30px sans-serif'; x.fillText('◤ 开黑点单', 44, 84);
    x.fillStyle = '#f6d78a'; x.font = 'bold 44px sans-serif'; x.fillText('不满意补 1 把', 44, 190);
    x.fillStyle = '#cfd8e3'; x.font = '22px sans-serif'; x.fillText('三角洲 · 语音指挥陪玩', 44, 232);
    var title = g.title.length > 15 ? g.title.slice(0, 15) : g.title;
    x.fillStyle = '#eef2f7'; x.font = 'bold 30px sans-serif'; x.fillText(title, 44, 320);
    x.fillStyle = '#e8b64c'; x.font = 'bold 64px sans-serif'; x.fillText('¥' + g.price, 44, 400);
    x.fillStyle = '#94a2b4'; x.font = '20px sans-serif'; x.fillText(g.unit, 160, 392);
    g.tags.forEach(function (t, i) { x.fillText('# ' + t, 44, 448 + i * 32); });
    x.strokeStyle = '#e8b64c'; x.strokeRect(410, 560, 140, 140);
    x.fillStyle = '#5d6b7c'; x.font = '16px sans-serif'; x.fillText('小程序码位', 420, 636);
    x.fillStyle = '#94a2b4'; x.font = '16px sans-serif';
    x.fillText('服务在老板本人账号内进行 · 不承诺游戏收益', 44, 742);
    openSheet('<div style="text-align:center"><b class="h2">分享海报</b><div style="margin:12px 0"><img src="' + c.toDataURL('image/png') + '" style="width:100%;max-width:300px;border-radius:14px"></div>' +
      '<a class="btn block" download="kahei-' + g.id + '.png" href="' + c.toDataURL('image/png') + '">保存图片</a>' +
      '<button class="btn ghost block" style="margin-top:8px" id="pLink">复制本页链接</button></div>');
    $('#pLink').onclick = function () {
      var link = location.href.split('#')[0] + '#/goods/' + g.id;
      var ta = document.createElement('textarea'); ta.value = link; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); say('链接已复制（推广归因正式版带编号）'); } catch (e) { say(link); }
      document.body.removeChild(ta);
    };
  }

  /* ---------- 全局点击委派 ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target, c = function (a) { return t.closest ? t.closest(a) : null; };
    var gGo = c('[data-filter]');
    if (gGo) {
      var i = Number(gGo.getAttribute('data-filter'));
      Array.prototype.forEach.call(document.querySelectorAll('[data-filter]'), function (el) { el.classList.remove('on'); });
      gGo.classList.add('on');
      var box = $('#list');
      if (box) {
        var list = D.goods.filter(function (g) { return i === 0 ? true : (i === 1 ? g.group.indexOf('新客') >= 0 : g.group.indexOf('夜猫') >= 0); });
        box.innerHTML = list.length ? list.map(goodsCard).join('') : '<div class="empty">该分类暂无项目</div>';
      }
      return;
    }
    var side = c('.side'); if (side) {
      Array.prototype.forEach.call(document.querySelectorAll('.side'), function (el) { el.classList.remove('side-on'); });
      side.classList.add('side-on'); drawShelf(side.getAttribute('data-game'), ($('#kw') || {}).value || ''); return;
    }
    var mg = c('[data-mgame]'); if (mg) {
      Array.prototype.forEach.call(document.querySelectorAll('[data-mgame]'), function (el) { el.classList.remove('on'); });
      mg.classList.add('on'); drawMates(mg.getAttribute('data-mgame'), ($('#mkw') || {}).value || '', (document.querySelector('[data-type].gold') || {}).textContent === '智能匹配' ? '' : ''); return;
    }
    var tp = c('[data-type]'); if (tp) {
      Array.prototype.forEach.call(document.querySelectorAll('[data-type]'), function (el) { el.classList.remove('gold'); });
      tp.classList.add('gold'); drawMates((document.querySelector('[data-mgame].on') || {}).getAttribute ? document.querySelector('[data-mgame].on').getAttribute('data-mgame') : '', ($('#mkw') || {}).value || '', tp.getAttribute('data-type')); return;
    }
    var ord = c('[data-order]'); if (ord) {
      var gg = D.goods.filter(function (x) { return String(x.id) === ord.getAttribute('data-order'); })[0]; orderSheet(gg); return;
    }
    var asg = c('[data-assign]') || c('[data-mate-order]');
    if (asg) {
      var mid = Number(asg.getAttribute('data-assign') || asg.getAttribute('data-mate-order'));
      var m = D.mates.filter(function (x) { return x.id === mid; })[0];
      var pick = D.goods.filter(function (g) { return g.game === m.gameKey; })[0] || D.goods[0];
      orderSheet(pick, mid); return;
    }
    var po = c('[data-poster]'); if (po) { poster(po.getAttribute('data-poster')); return; }
    var fv = c('[data-fav]'); if (fv) {
      var idv = Number(fv.getAttribute('data-fav')), fav = ls(K.fav, []), at = fav.indexOf(idv);
      if (at >= 0) { fav.splice(at, 1); say('已取消收藏'); } else { fav.push(idv); say('已收藏'); }
      save(K.fav, fav); return;
    }
    var csno = c('[data-csno]'); if (csno) { cs(csno.getAttribute('data-csno')); return; }
    if (c('[data-cs]')) { cs(); return; }
    var nx = c('[data-next]'); if (nx) {
      var no = nx.getAttribute('data-next'), o = orders().filter(function (x) { return x.no === no; })[0];
      var next = NEXT[o.status];
      var patch = { status: next };
      if (next === 'accepted') patch.mate = o.mate || '夜航 A-2041（已派单）';
      setOrder(no, patch);
      if (next === 'done') { save(K.mate, ls(K.mate, []).concat([Number((o.amount * D.rates.mate / 100).toFixed(2))])); }
      say(next === 'done' ? '验收通过，指挥收益已结算（模拟）' : '状态已推进：' + STATUS[next]);
      render(); return;
    }
    var ca = c('[data-cancel]'); if (ca) { setOrder(ca.getAttribute('data-cancel'), { status: 'closed' }); say('预约单已取消'); render(); return; }
    var gr = c('[data-grab]'); if (gr) {
      var r = D.grabs[Number(gr.getAttribute('data-grab'))];
      r.taken = true; gr.textContent = '已抢到，待老板确认'; gr.classList.add('ghost');
      say('抢单成功：可得 ¥' + (r.budget * D.rates.mate / 100).toFixed(2) + '（正式版此处语音抢单）'); return;
    }
    if (c('#joinGo')) {
      var age = Number(($('#ja') || {}).value || 0);
      if (!($('#jn') || {}).value) { say('请填写昵称'); return; }
      if (age < 18 || !age) { say('需年满 18 岁才能入驻接单'); return; }
      openSheet('<div style="text-align:center;padding:16px 0"><div class="tag" style="letter-spacing:4px">申请已提交</div>' +
        '<div class="sub" style="margin:14px 0;line-height:1.9">正式版流程：段位截图核验 → 试单 3 局 → 开通抢单权限。<br>demo 未接入后端，不会真的审核。</div>' +
        '<button class="btn block" id="j2w">先体验抢单端</button></div>');
      $('#j2w').onclick = function () { closeSheet(); location.hash = '#/work'; };
      return;
    }
    if (c('#clr')) { if (confirm('清空本机预约记录？')) { save(K.order, []); render(); say('已清空'); } return; }
    if (c('.buy') && !c('[data-order]')) {
      var card = t.closest('.goods'); if (card) {
        var m2 = card.querySelector('[data-assign]'); if (m2) { m2.click(); return; }
        var link = card.getAttribute('data-go'); if (link) location.hash = link;
      }
    }
  });

  document.addEventListener('input', function (e) {
    if (e.target.id === 'kw') drawShelf((document.querySelector('.side-on') || {}).getAttribute ? document.querySelector('.side-on').getAttribute('data-game') : '1', e.target.value);
    if (e.target.id === 'mkw') drawMates((document.querySelector('[data-mgame].on') || {}).getAttribute ? document.querySelector('[data-mgame].on').getAttribute('data-mgame') : '', e.target.value, (document.querySelector('[data-type].gold') || {}).getAttribute === 'function' ? (document.querySelector('[data-type].gold') || {}).getAttribute('data-type') : '');
  });

  window.addEventListener('hashchange', render);
  render();
})();
