export function GuidePanel() {
  return (
    <div className="flex flex-col gap-2.5 h-full overflow-y-auto p-2 sm:p-3 text-[11px] sm:text-xs leading-relaxed">
      <h3 className="text-sm font-bold text-amber-200">游戏说明书</h3>

      <Section title="基本流程">
        <Li>选将领 → 选地图/阵法/模式 → 布阵</Li>
        <Li>拖拽阵营圆圈调整出生位置 → 开战</Li>
        <Li>空格暂停，0-4调速度，R重开</Li>
        <Li>滚轮缩放，拖拽平移，点击单位看详情</Li>
        <Li>☆按钮可单独强化任意将领(HP×2.5 攻×2 防×1.8)</Li>
      </Section>

      <Section title="三种模式">
        <Li><B>阵营对抗</B> — 最后存活的阵营/联盟胜</Li>
        <Li><B>混战</B> — 所有人互打，最后存活者胜</Li>
        <Li><B>攻城</B> — 攻方攻入城池占领城心，或守方坚守4000tick</Li>
      </Section>

      <Section title="联盟系统">
        <Li>部分历史战役含跨阵营联盟(🤝标识)</Li>
        <Li>联盟内不互攻、共享士气光环/战吼</Li>
        <Li>投降/溃败判定认盟友为友军</Li>
      </Section>

      <Section title="六维属性">
        <Li><B>统</B> 阵型协同、攻防加成</Li>
        <Li><B>谋</B> 目标选择、技能触发、远程攻击+40%(谋略100)</Li>
        <Li><B>政</B> 士气恢复、抗疲劳、治疗加成</Li>
        <Li><B>勇</B> 近战+40%、横扫、闪避、反击、威慑、背水</Li>
        <Li><B>功</B> 初始士气、威慑减防</Li>
        <Li><B>德</B> 士气光环160px、战吼+15、抗溃败</Li>
      </Section>

      <Section title="武力机制">
        <Li><B>横扫</B> 武力≥85 近战同时打1-3人(40%伤害)</Li>
        <Li><B>闪避</B> 速度+武力 → 最高18%闪避</Li>
        <Li><B>反击</B> 武力≥88 被打时20%概率反击</Li>
        <Li><B>威慑</B> 武力≥88 55px内敌人攻击力-8%</Li>
        <Li><B>破阵</B> 武力&gt;敌方统帅 → 削弱阵型防御</Li>
        <Li><B>背水</B> HP&lt;25% 攻击+40% 防御+25%</Li>
        <Li><B>冲锋护盾</B> 骑兵冲锋命中后25tick士气免疫+10</Li>
      </Section>

      <Section title="兵种克制">
        <Li>骑克弓1.4x / 枪克骑1.35x / 盾克弓1.3x / 弓克枪1.2x</Li>
      </Section>

      <Section title="四层AI">
        <Li><B>指挥风格</B> 8种: 稳扎稳打/全军突击/以逸待劳/两面夹击/斩首行动/化整为零 → 指挥官死后退化为群龙无首</Li>
        <Li><B>高级AI</B> 战局5阶段判断 + 阵营专属战术(蜀=突击/吴=火攻/袁绍=防守)</Li>
        <Li><B>指挥官AI</B> 集火/撤退/保护指令</Li>
        <Li><B>兵种AI</B> 弓兵风筝退向友军/骑兵不冲人堆只猎落单/盾兵护弓/枪兵反骑</Li>
      </Section>

      <Section title="战斗机制">
        <Li>侧击+35% / 冲锋动量+80% / 森林伏击+25-50%</Li>
        <Li>单挑 / 齐射 / 盾墙 / 架枪 / 战吼 / 斩将 / 投降 / 士气连锁</Li>
      </Section>

      <Section title="士气系统">
        <Li>撤退线22 / 溃败线6 / 恢复线38 / 每tick上限-20</Li>
        <Li><B>纪律</B>减少士气损失(95=-38%) / <B>忠诚</B>抵抗撤退</Li>
        <Li>指挥官集结180px / 魅力光环160px / 连锁5%·70px</Li>
      </Section>

      <Section title="阵法">
        <Li>鹤翼(弓+射程攻击) / 锥形(骑+冲锋) / 方圆(防+士气)</Li>
        <Li>鱼鳞(攻防均衡) / 雁行(机动) / 长蛇(高速-防)</Li>
      </Section>

      <Section title="地形与天气">
        <Li>山脉/城墙=不可通行 / 森林=减速+防+可放火 / 桥=咽喉</Li>
        <Li>火计点燃森林，风天加速蔓延，雨天河流泛滥</Li>
        <Li>雨(远程-30%) / 雾(视野-50%) / 风(火+40%)</Li>
      </Section>

      <Section title="攻城模式">
        <Li>城墙+4城门+4箭塔(HP500) / 攻方自动向城门推进</Li>
        <Li>攻方: 3+人进城心60px持续200tick→胜</Li>
        <Li>守方: 坚守4000tick或消灭攻方→胜</Li>
      </Section>

      <Section title="其他">
        <Li>30张地图(含城池/要塞/迷宫等) · 25场历史战役</Li>
        <Li>214将领(10势力各20人) + 14神将(可选)</Li>
        <Li>11项设置开关 · Seed确定性 · 本地战史记录</Li>
        <Li>批量模拟20/50/100次 · 战后MVP雷达图</Li>
      </Section>

      <div className="text-gray-600 text-[9px] pt-2 border-t border-gray-800 text-center">
        三国演弈 v2.0 | 30地图 · 214将领 · 25战役 · 4层AI
        <br />
        <span className="text-gray-700">By KurtDubain</span>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-amber-300/80 mb-0.5">{title}</div>
      <ul className="space-y-0.5 text-gray-300">{children}</ul>
    </div>
  )
}

function Li({ children }: { children: React.ReactNode }) {
  return <li className="flex gap-1 items-start"><span className="text-gray-600 mt-0.5 shrink-0">·</span><span>{children}</span></li>
}

function B({ children }: { children: React.ReactNode }) {
  return <span className="text-amber-200/70 font-medium">{children}</span>
}
