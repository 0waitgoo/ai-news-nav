// 轻量拼音首字母工具：仅覆盖常用汉字，用于搜索的拼音首字母匹配（如 "db" 命中「豆包」）
// 不引入第三方库，未收录的汉字会被跳过。

const INITIAL_GROUPS: Record<string, string> = {
  a: '阿啊哀爱安暗',
  b: '八百办宝报北本比笔毕边表别病博不布部播变包编',
  c: '查城程出初长常场厂车陈成冲传创词次从参测策',
  d: '豆大代单当到地第点电店都读独动定度队多对道',
  e: '鹅饿恩而儿耳二',
  f: '飞风封分丰峰锋夫服福辅富复发法番方访放非',
  g: '国工公功共购个各给根跟更光广规果过感高',
  h: '盒海火花黄回会混活或货红后候湖护互户华化画欢环换话',
  j: '即机基极集级急技计记际继绩加家价架间简见建江讲交教接节结解界金今进近京经景净究九久酒就局举记具剪降',
  k: '可快开看刊科客课空口苦库块',
  l: '灵龙来蓝老乐雷类离李里理力立利连联脸练凉两亮量聊列林临流留六隆楼录路旅律绿论螺',
  m: '梦码猫秘米马买卖满慢忙毛冒么没美每门们萌盟面苗秒民名明命模魔末莫墨默目木',
  n: '能南男脑闹内你年念鸟您牛农弄怒女',
  o: '哦欧偶',
  p: '朋盘判旁配培陪片篇票品平评频',
  q: '千问气汽前钱强桥巧切亲秦琴青轻清情请秋求球区曲去趣全权泉',
  r: '人认日容荣融柔肉如入润若',
  s: '三山上少社设深神生声胜师十时识实世市示事视试室是收手首书数术树双谁水睡顺说思四似松送苏速诉酸算虽随岁孙索所',
  t: '通塔豚腾他她它台太态谈汤堂糖桃特提题体天田条听庭同统头投图土团推退吞托',
  w: '文万未问外王网往忘望微为维位翁我沃无五午武舞勿物务',
  x: '心讯星西希析昔息悉惜锡溪熙熹习洗喜戏系细隙下夏先仙鲜闲贤弦咸衔显险现献县限线乡相香响想向象像小晓孝校笑些协写谢新信兴行形型幸性姓兄休修秀须需徐许序绪续宣旋选学雪血虾',
  y: '义言元映有语压牙雅亚严颜沿研盐眼演厌彦验央扬羊洋阳养样要药耀爷也业叶夜一依衣医已以艺议易意因音银引印应英迎影永勇用优幽悠油友右又鱼愉娱羽雨玉育预原员圆源远院愿月乐越云匀运',
  z: '杂早造责择泽增展占站章张掌找照召赵哲这真镇争正政证之知直执值职止只纸指至志制治智中种重众周州洲轴主住助注著筑抓转庄装状追准桌着姿资紫字自总走租组祖钻最左作做',
};

const CHAR_TO_INITIAL = new Map<string, string>();
for (const [initial, chars] of Object.entries(INITIAL_GROUPS)) {
  for (const ch of chars) {
    if (!CHAR_TO_INITIAL.has(ch)) CHAR_TO_INITIAL.set(ch, initial);
  }
}

/** 取一段文字的拼音首字母串，如「豆包」-> "db"；英文/数字原样保留（小写） */
export function getPinyinInitials(text: string): string {
  let result = '';
  for (const ch of text) {
    if (/[a-zA-Z0-9]/.test(ch)) {
      result += ch.toLowerCase();
    } else {
      const initial = CHAR_TO_INITIAL.get(ch);
      if (initial) result += initial;
    }
  }
  return result;
}

export function isLatinQuery(query: string): boolean {
  return /^[a-zA-Z0-9\s]+$/.test(query.trim());
}
