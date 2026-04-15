export function GuidePanel() {
  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto p-3 text-xs leading-relaxed">
      <h3 className="text-sm font-bold text-amber-200">游戏说明书</h3>

      <Section title="基本操作">
        <Li>选将领 → 选地图 → 选模式 → 布阵 → 开战</Li>
        <Li>空格 暂停/继续，0-4 调速度，R 重开</Li>
        <Li>滚轮缩放战场，拖拽平移，点击单位看详情</Li>
        <Li>双击画布重置视角，ESC 取消选中</Li>
      </Section>

      <Section title="三种模式">
        <Li><B>阵营对抗</B> — 最后存活的阵营胜</Li>
        <Li><B>混战</B> — 最后存活的将领胜</Li>
        <Li><B>攻城</B> — 攻方攻入城池占领城心，或守方坚守 4000 tick</Li>
      </Section>

      <Section title="六维属性">
        <Li><B>统</B> 带兵效率、阵型协同</Li>
        <Li><B>谋</B> 目标选择、技能触发、绕后</Li>
        <Li><B>政</B> 士气恢复、抗疲劳、补给线</Li>
        <Li><B>勇</B> 近战输出、横扫、闪避、反击、威慑</Li>
        <Li><B>功</B> 初始士气、威慑减防</Li>
        <Li><B>德</B> 士气光环、战吼、抗溃败</Li>
      </Section>

      <Section title="武力机制 (勇)">
        <Li><B>横扫</B> 武力≥80 近战同时打 1-3 人</Li>
        <Li><B>闪避</B> 速度+武力 → 最高 25% 闪避</Li>
        <Li><B>反击</B> 武力≥85 被打时 30% 概率反击</Li>
        <Li><B>威慑</B> 武力≥85 附近敌人攻击力 -12%</Li>
        <Li><B>破阵</B> 武力&gt;敌方统帅 → 削弱阵型防御</Li>
        <Li><B>背水</B> HP&lt;30% 攻击力最高 +60%</Li>
      </Section>

      <Section title="兵种克制">
        <Li>骑兵 克 弓兵 (1.4x)，被 枪兵 克 (0.7x)</Li>
        <Li>枪兵 克 骑兵 (1.35x)，被 弓兵 克 (0.8x)</Li>
        <Li>盾兵 克 弓兵 (1.3x)，被 骑兵 略克 (0.7x)</Li>
        <Li>弓兵 克 枪兵 (1.2x)，被 盾兵 克 (0.6x)</Li>
      </Section>

      <Section title="兵种 AI">
        <Li><B>弓兵</B> 风筝走位，保持射程，被近身后撤</Li>
        <Li><B>骑兵</B> 绕后突袭，优先猎杀弓兵</Li>
        <Li><B>盾兵</B> 站在弓兵前面挡伤害</Li>
        <Li><B>枪兵</B> 优先拦截敌方骑兵</Li>
        <Li><B>步兵</B> 优先攻击残血和溃败目标</Li>
      </Section>

      <Section title="战斗机制">
        <Li><B>侧击</B> 从背后打 +35% 伤害</Li>
        <Li><B>冲锋</B> 骑兵冲刺 60px+ 首击 +80%</Li>
        <Li><B>伏击</B> 从森林打非森林 +25-50%</Li>
        <Li><B>单挑</B> 武力 80+ 互攻时触发独立回合</Li>
        <Li><B>齐射</B> 3+ 弓兵集中 → 全员攻击力 +20-45%</Li>
        <Li><B>盾墙</B> 2+ 盾兵相邻 → 防御 +30-50%</Li>
        <Li><B>架枪</B> 敌骑兵冲来时 → 防+40% 攻+25%</Li>
        <Li><B>战吼</B> 德 80+ 将领鼓舞附近友军</Li>
        <Li><B>斩将</B> 击杀指挥官 → 近处-15/远处-6 士气</Li>
        <Li><B>投降</B> 孤立+残血+低士气 → 退出战斗</Li>
        <Li><B>冲锋护盾</B> 骑兵冲锋命中后 25tick 免疫士气损失</Li>
      </Section>

      <Section title="士气系统">
        <Li>撤退线 22 / 溃败线 6 / 溃败恢复线 38</Li>
        <Li>每 tick 最多掉 20 士气（防雪崩）</Li>
        <Li><B>纪律</B> 减少被打时的士气损失（纪律95=-38%）</Li>
        <Li><B>忠诚</B> 抵抗撤退（忠诚100=69%拒绝撤退）</Li>
        <Li><B>指挥官集结</B> 180px 内统帅80+的友军加速恢复</Li>
        <Li><B>魅力光环</B> 160px 内高德将领持续回士气</Li>
        <Li><B>阵型舒适</B> 附近友军越多，恢复越快</Li>
        <Li>连锁崩溃：5%概率，70px范围，-8士气</Li>
        <Li>溃败中的单位几乎不回士气，需要脱离战斗</Li>
      </Section>

      <Section title="阵法（开战前选）">
        <Li><B>鹤翼阵</B> 射程+15%, 攻击+12% — 适合弓兵</Li>
        <Li><B>锥形阵</B> 速度+10%, 冲锋+35%, 攻击+8% — 骑兵突击</Li>
        <Li><B>方圆阵</B> 防御+25%, 士气+10%, 速度-10% — 盾兵防守</Li>
        <Li><B>鱼鳞阵</B> 攻击+15%, 防御+10% — 步兵/枪兵均衡</Li>
        <Li><B>雁行阵</B> 速度+8%, 攻击+10% — 机动作战</Li>
        <Li><B>长蛇阵</B> 速度+20%, 防御-8% — 高速奔袭</Li>
      </Section>

      <Section title="地形">
        <Li><B>平原</B> 无修正</Li>
        <Li><B>森林</B> 减速 0.55x，防+15，视野-50%，可放火</Li>
        <Li><B>山脉/城墙</B> 不可通行，阻挡视线和攻击</Li>
        <Li><B>河流</B> 不可通行，阻挡近战，远程可穿越</Li>
        <Li><B>桥梁</B> 可通行 0.8x，咽喉要道</Li>
        <Li>靠近山脉获得 +15% 防御</Li>
        <Li>火计可点燃森林，风天加速蔓延</Li>
      </Section>

      <Section title="天气">
        <Li><B>雨</B> 远程-30%，速度-15%，火计弱，河流泛滥</Li>
        <Li><B>雾</B> 视野-50%</Li>
        <Li><B>风</B> 远程-15%，火计+40%，加速蔓延</Li>
      </Section>

      <Section title="攻城模式">
        <Li>中央城池有城墙围绕，4 个城门可进</Li>
        <Li>四角各一座箭塔（HP 500，射程 130）</Li>
        <Li>攻方：3+ 人进入城心 60px 持续 200 tick → 胜</Li>
        <Li>守方：坚守 4000 tick 或消灭全部攻方 → 胜</Li>
        <Li>箭塔可被近战摧毁</Li>
      </Section>

      <Section title="补给与毒圈">
        <Li>补给点：绿色光圈，站内回血回士气，2000 tick 后消失</Li>
        <Li>毒圈：800 tick 后开始缩圈，圈外掉血掉士气</Li>
        <Li>补给线：离出生点越远，士气恢复越慢</Li>
      </Section>

      <Section title="势力（10 个）">
        <Li>魏 / 蜀 / 吴 / 群雄 — 三国四大阵营各 20 人</Li>
        <Li>董卓 / 袁绍 / 西凉 / 荆州 / 益州 / 晋 — 各 20 人</Li>
        <Li>14 名神将（可选开启，以一当十）</Li>
        <Li>12 场预设历史战役</Li>
      </Section>

      <Section title="设置">
        <Li>10 项玩法机制可独立开关</Li>
        <Li>天气 / 毒圈 / 补给 / AI / 单挑 / 阵型 / 战吼 / 投降 / 斩将</Li>
        <Li>重开后生效</Li>
      </Section>

      <div className="text-gray-600 text-[10px] pt-2 border-t border-gray-800">
        三国演弈 v1.0 | 30张地图 · 214将领 · 10势力
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-amber-300/80 mb-1">{title}</div>
      <ul className="space-y-0.5 text-gray-300">{children}</ul>
    </div>
  )
}

function Li({ children }: { children: React.ReactNode }) {
  return <li className="flex gap-1.5 items-start"><span className="text-gray-600 mt-0.5">-</span><span>{children}</span></li>
}

function B({ children }: { children: React.ReactNode }) {
  return <span className="text-amber-200/70 font-medium">{children}</span>
}
