/**
 * 中国传统色数据集（第一百零七轮，中式色卡组件内置数据）：
 * 158 色 / 10 色系，随包构建、零联网。来源与整理口径见
 * ~/workspace/your_files/ai-news-nav/中式色卡/设计稿.md 第 6 节
 * （《中国传统颜色》通行名录为底本、双源交叉核对 HEX、CMYK 为公式换算值）。
 * 本文件由 colors.json 生成，字段与之逐字一致；数据集修订时同步替换。
 */

export interface TraditionalColor {
  name: string;
  /** 小写 #rrggbb */
  hex: string;
  rgb: [number, number, number];
  cmyk: [number, number, number, number];
  /** 色系：红/橙/黄/绿/青/蓝/紫/褐/灰/黑白 */
  family: string;
  /** 带声调拼音 */
  pinyin: string;
}

export const TRADITIONAL_COLORS: TraditionalColor[] = [
  { name: '大红', hex: '#ff2121', rgb: [255, 33, 33], cmyk: [0, 87, 87, 0], family: '红', pinyin: 'dàhóng' },
  { name: '朱红', hex: '#ff4c00', rgb: [255, 76, 0], cmyk: [0, 70, 100, 0], family: '红', pinyin: 'zhūhóng' },
  { name: '朱砂', hex: '#ff461f', rgb: [255, 70, 31], cmyk: [0, 73, 88, 0], family: '红', pinyin: 'zhūshā' },
  { name: '胭脂', hex: '#9d2933', rgb: [157, 41, 51], cmyk: [0, 74, 68, 38], family: '红', pinyin: 'yānzhī' },
  { name: '绯红', hex: '#c83c23', rgb: [200, 60, 35], cmyk: [0, 70, 82, 22], family: '红', pinyin: 'fēihóng' },
  { name: '石榴红', hex: '#f20c00', rgb: [242, 12, 0], cmyk: [0, 95, 100, 5], family: '红', pinyin: 'shíliuhóng' },
  { name: '海棠红', hex: '#db5a6b', rgb: [219, 90, 107], cmyk: [0, 59, 51, 14], family: '红', pinyin: 'hǎitánghóng' },
  { name: '樱桃色', hex: '#c93756', rgb: [201, 55, 86], cmyk: [0, 73, 57, 21], family: '红', pinyin: 'yīngtáosè' },
  { name: '品红', hex: '#f00056', rgb: [240, 0, 86], cmyk: [0, 100, 64, 6], family: '红', pinyin: 'pǐnhóng' },
  { name: '洋红', hex: '#ff0097', rgb: [255, 0, 151], cmyk: [0, 100, 41, 0], family: '红', pinyin: 'yánghóng' },
  { name: '桃红', hex: '#f47983', rgb: [244, 121, 131], cmyk: [0, 50, 46, 4], family: '红', pinyin: 'táohóng' },
  { name: '粉红', hex: '#ffb3a7', rgb: [255, 179, 167], cmyk: [0, 30, 35, 0], family: '红', pinyin: 'fěnhóng' },
  { name: '妃色', hex: '#ed5736', rgb: [237, 87, 54], cmyk: [0, 63, 77, 7], family: '红', pinyin: 'fēisè' },
  { name: '银红', hex: '#f05654', rgb: [240, 86, 84], cmyk: [0, 64, 65, 6], family: '红', pinyin: 'yínhóng' },
  { name: '火红', hex: '#ff2d51', rgb: [255, 45, 81], cmyk: [0, 82, 68, 0], family: '红', pinyin: 'huǒhóng' },
  { name: '赫赤', hex: '#c91f37', rgb: [201, 31, 55], cmyk: [0, 85, 73, 21], family: '红', pinyin: 'hèchì' },
  { name: '嫣红', hex: '#ef7a82', rgb: [239, 122, 130], cmyk: [0, 49, 46, 6], family: '红', pinyin: 'yānhóng' },
  { name: '茜色', hex: '#cb3a56', rgb: [203, 58, 86], cmyk: [0, 71, 58, 20], family: '红', pinyin: 'qiànsè' },
  { name: '枣红', hex: '#c32136', rgb: [195, 33, 54], cmyk: [0, 83, 72, 24], family: '红', pinyin: 'zǎohóng' },
  { name: '殷红', hex: '#be002f', rgb: [190, 0, 47], cmyk: [0, 100, 75, 25], family: '红', pinyin: 'yānhóng' },
  { name: '酡红', hex: '#dc3023', rgb: [220, 48, 35], cmyk: [0, 78, 84, 14], family: '红', pinyin: 'tuóhóng' },
  { name: '赤', hex: '#c3272b', rgb: [195, 39, 43], cmyk: [0, 80, 78, 24], family: '红', pinyin: 'chì' },
  { name: '丹', hex: '#ff4e20', rgb: [255, 78, 32], cmyk: [0, 69, 87, 0], family: '红', pinyin: 'dān' },
  { name: '彤', hex: '#f35336', rgb: [243, 83, 54], cmyk: [0, 66, 78, 5], family: '红', pinyin: 'tóng' },
  { name: '水红', hex: '#f3d3e7', rgb: [243, 211, 231], cmyk: [0, 13, 5, 5], family: '红', pinyin: 'shuǐhóng' },
  { name: '橘红', hex: '#ff7500', rgb: [255, 117, 0], cmyk: [0, 54, 100, 0], family: '橙', pinyin: 'júhóng' },
  { name: '橘黄', hex: '#ff8936', rgb: [255, 137, 54], cmyk: [0, 46, 79, 0], family: '橙', pinyin: 'júhuáng' },
  { name: '橙黄', hex: '#ffa400', rgb: [255, 164, 0], cmyk: [0, 36, 100, 0], family: '橙', pinyin: 'chénghuáng' },
  { name: '杏红', hex: '#ff8c31', rgb: [255, 140, 49], cmyk: [0, 45, 81, 0], family: '橙', pinyin: 'xìnghóng' },
  { name: '酡颜', hex: '#f9906f', rgb: [249, 144, 111], cmyk: [0, 42, 55, 2], family: '橙', pinyin: 'tuóyán' },
  { name: '琥珀', hex: '#ca6924', rgb: [202, 105, 36], cmyk: [0, 48, 82, 21], family: '橙', pinyin: 'hǔpò' },
  { name: '黄栌', hex: '#e29c45', rgb: [226, 156, 69], cmyk: [0, 31, 69, 11], family: '橙', pinyin: 'huánglú' },
  { name: '鹅黄', hex: '#fff143', rgb: [255, 241, 67], cmyk: [0, 5, 74, 0], family: '黄', pinyin: 'éhuáng' },
  { name: '鸭黄', hex: '#faff72', rgb: [250, 255, 114], cmyk: [2, 0, 55, 0], family: '黄', pinyin: 'yāhuáng' },
  { name: '樱草色', hex: '#eaff56', rgb: [234, 255, 86], cmyk: [8, 0, 66, 0], family: '黄', pinyin: 'yīngcǎosè' },
  { name: '杏黄', hex: '#ffa631', rgb: [255, 166, 49], cmyk: [0, 35, 81, 0], family: '黄', pinyin: 'xìnghuáng' },
  { name: '姜黄', hex: '#ffc773', rgb: [255, 199, 115], cmyk: [0, 22, 55, 0], family: '黄', pinyin: 'jiānghuáng' },
  { name: '缃色', hex: '#f0c239', rgb: [240, 194, 57], cmyk: [0, 19, 76, 6], family: '黄', pinyin: 'xiāngsè' },
  { name: '秋香色', hex: '#d9b611', rgb: [217, 182, 17], cmyk: [0, 16, 92, 15], family: '黄', pinyin: 'qiūxiāngsè' },
  { name: '昏黄', hex: '#c89b40', rgb: [200, 155, 64], cmyk: [0, 23, 68, 22], family: '黄', pinyin: 'hūnhuáng' },
  { name: '枯黄', hex: '#d3b17d', rgb: [211, 177, 125], cmyk: [0, 16, 41, 17], family: '黄', pinyin: 'kūhuáng' },
  { name: '柳黄', hex: '#c9dd22', rgb: [201, 221, 34], cmyk: [9, 0, 85, 13], family: '黄', pinyin: 'liǔhuáng' },
  { name: '赤金', hex: '#f2be45', rgb: [242, 190, 69], cmyk: [0, 21, 71, 5], family: '黄', pinyin: 'chìjīn' },
  { name: '金色', hex: '#eacd76', rgb: [234, 205, 118], cmyk: [0, 12, 50, 8], family: '黄', pinyin: 'jīnsè' },
  { name: '乌金', hex: '#a78e44', rgb: [167, 142, 68], cmyk: [0, 15, 59, 35], family: '黄', pinyin: 'wūjīn' },
  { name: '嫩绿', hex: '#bddd22', rgb: [189, 221, 34], cmyk: [14, 0, 85, 13], family: '绿', pinyin: 'nènlǜ' },
  { name: '柳绿', hex: '#afdd22', rgb: [175, 221, 34], cmyk: [21, 0, 85, 13], family: '绿', pinyin: 'liǔlǜ' },
  { name: '草绿', hex: '#40de5a', rgb: [64, 222, 90], cmyk: [71, 0, 59, 13], family: '绿', pinyin: 'cǎolǜ' },
  { name: '绿色', hex: '#00e500', rgb: [0, 229, 0], cmyk: [100, 0, 100, 10], family: '绿', pinyin: 'lǜsè' },
  { name: '油绿', hex: '#00bc12', rgb: [0, 188, 18], cmyk: [100, 0, 90, 26], family: '绿', pinyin: 'yóulǜ' },
  { name: '葱绿', hex: '#9ed900', rgb: [158, 217, 0], cmyk: [27, 0, 100, 15], family: '绿', pinyin: 'cōnglǜ' },
  { name: '葱青', hex: '#0eb83a', rgb: [14, 184, 58], cmyk: [92, 0, 68, 28], family: '绿', pinyin: 'cōngqīng' },
  { name: '青葱', hex: '#0aa344', rgb: [10, 163, 68], cmyk: [94, 0, 58, 36], family: '绿', pinyin: 'qīngcōng' },
  { name: '葱黄', hex: '#a3d900', rgb: [163, 217, 0], cmyk: [25, 0, 100, 15], family: '绿', pinyin: 'cōnghuáng' },
  { name: '绿沈', hex: '#0c8918', rgb: [12, 137, 24], cmyk: [91, 0, 82, 46], family: '绿', pinyin: 'lǜchén' },
  { name: '豆绿', hex: '#9ed048', rgb: [158, 208, 72], cmyk: [24, 0, 65, 18], family: '绿', pinyin: 'dòulǜ' },
  { name: '豆青', hex: '#96ce54', rgb: [150, 206, 84], cmyk: [27, 0, 59, 19], family: '绿', pinyin: 'dòuqīng' },
  { name: '竹青', hex: '#789262', rgb: [120, 146, 98], cmyk: [18, 0, 33, 43], family: '绿', pinyin: 'zhúqīng' },
  { name: '艾绿', hex: '#a4e2c6', rgb: [164, 226, 198], cmyk: [27, 0, 12, 11], family: '绿', pinyin: 'àilǜ' },
  { name: '松柏绿', hex: '#21a675', rgb: [33, 166, 117], cmyk: [80, 0, 30, 35], family: '绿', pinyin: 'sōngbǎilǜ' },
  { name: '松花绿', hex: '#057748', rgb: [5, 119, 72], cmyk: [96, 0, 39, 53], family: '绿', pinyin: 'sōnghuālǜ' },
  { name: '松花色', hex: '#bce672', rgb: [188, 230, 114], cmyk: [18, 0, 50, 10], family: '绿', pinyin: 'sōnghuāsè' },
  { name: '苍翠', hex: '#519a73', rgb: [81, 154, 115], cmyk: [47, 0, 25, 40], family: '绿', pinyin: 'cāngcuì' },
  { name: '铜绿', hex: '#549688', rgb: [84, 150, 136], cmyk: [44, 0, 9, 41], family: '绿', pinyin: 'tónglǜ' },
  { name: '青色', hex: '#00e09e', rgb: [0, 224, 158], cmyk: [100, 0, 29, 12], family: '青', pinyin: 'qīngsè' },
  { name: '青翠', hex: '#00e079', rgb: [0, 224, 121], cmyk: [100, 0, 46, 12], family: '青', pinyin: 'qīngcuì' },
  { name: '碧色', hex: '#1bd1a5', rgb: [27, 209, 165], cmyk: [87, 0, 21, 18], family: '青', pinyin: 'bìsè' },
  { name: '碧绿', hex: '#2add9c', rgb: [42, 221, 156], cmyk: [81, 0, 29, 13], family: '青', pinyin: 'bìlǜ' },
  { name: '青碧', hex: '#48c0a3', rgb: [72, 192, 163], cmyk: [62, 0, 15, 25], family: '青', pinyin: 'qīngbì' },
  { name: '翡翠色', hex: '#3de1ad', rgb: [61, 225, 173], cmyk: [73, 0, 23, 12], family: '青', pinyin: 'fěicuìsè' },
  { name: '玉色', hex: '#2edfa3', rgb: [46, 223, 163], cmyk: [79, 0, 27, 13], family: '青', pinyin: 'yùsè' },
  { name: '石青', hex: '#7bcfa6', rgb: [123, 207, 166], cmyk: [41, 0, 20, 19], family: '青', pinyin: 'shíqīng' },
  { name: '缥', hex: '#7fecad', rgb: [127, 236, 173], cmyk: [46, 0, 27, 7], family: '青', pinyin: 'piāo' },
  { name: '碧蓝', hex: '#3eede7', rgb: [62, 237, 231], cmyk: [74, 0, 3, 7], family: '青', pinyin: 'bìlán' },
  { name: '黛绿', hex: '#426666', rgb: [66, 102, 102], cmyk: [35, 0, 0, 60], family: '青', pinyin: 'dàilǜ' },
  { name: '鸭卵青', hex: '#e0eee8', rgb: [224, 238, 232], cmyk: [6, 0, 3, 7], family: '青', pinyin: 'yāluǎnqīng' },
  { name: '蟹壳青', hex: '#bbcdc5', rgb: [187, 205, 197], cmyk: [9, 0, 4, 20], family: '青', pinyin: 'xièkéqīng' },
  { name: '青白', hex: '#c0ebd7', rgb: [192, 235, 215], cmyk: [18, 0, 9, 8], family: '青', pinyin: 'qīngbái' },
  { name: '水色', hex: '#88ada6', rgb: [136, 173, 166], cmyk: [21, 0, 4, 32], family: '青', pinyin: 'shuǐsè' },
  { name: '水绿', hex: '#d4f2e7', rgb: [212, 242, 231], cmyk: [12, 0, 5, 5], family: '青', pinyin: 'shuǐlǜ' },
  { name: '靛蓝', hex: '#065279', rgb: [6, 82, 121], cmyk: [95, 32, 0, 53], family: '蓝', pinyin: 'diànlán' },
  { name: '靛青', hex: '#177cb0', rgb: [23, 124, 176], cmyk: [87, 30, 0, 31], family: '蓝', pinyin: 'diànqīng' },
  { name: '花青', hex: '#003472', rgb: [0, 52, 114], cmyk: [100, 54, 0, 55], family: '蓝', pinyin: 'huāqīng' },
  { name: '群青', hex: '#4c8dae', rgb: [76, 141, 174], cmyk: [56, 19, 0, 32], family: '蓝', pinyin: 'qúnqīng' },
  { name: '宝蓝', hex: '#4b5cc4', rgb: [75, 92, 196], cmyk: [62, 53, 0, 23], family: '蓝', pinyin: 'bǎolán' },
  { name: '藏青', hex: '#2e4e7e', rgb: [46, 78, 126], cmyk: [63, 38, 0, 51], family: '蓝', pinyin: 'zàngqīng' },
  { name: '藏蓝', hex: '#3b2e7e', rgb: [59, 46, 126], cmyk: [53, 63, 0, 51], family: '蓝', pinyin: 'zànglán' },
  { name: '黛蓝', hex: '#425066', rgb: [66, 80, 102], cmyk: [35, 22, 0, 60], family: '蓝', pinyin: 'dàilán' },
  { name: '绀青', hex: '#003371', rgb: [0, 51, 113], cmyk: [100, 55, 0, 56], family: '蓝', pinyin: 'gànqīng' },
  { name: '蔚蓝', hex: '#70f3ff', rgb: [112, 243, 255], cmyk: [56, 5, 0, 0], family: '蓝', pinyin: 'wèilán' },
  { name: '湖蓝', hex: '#30dff3', rgb: [48, 223, 243], cmyk: [80, 8, 0, 5], family: '蓝', pinyin: 'húlán' },
  { name: '苍青', hex: '#7397ab', rgb: [115, 151, 171], cmyk: [33, 12, 0, 33], family: '蓝', pinyin: 'cāngqīng' },
  { name: '水蓝', hex: '#d2f0f4', rgb: [210, 240, 244], cmyk: [14, 2, 0, 4], family: '蓝', pinyin: 'shuǐlán' },
  { name: '淡青', hex: '#d3e0f3', rgb: [211, 224, 243], cmyk: [13, 8, 0, 5], family: '蓝', pinyin: 'dànqīng' },
  { name: '紫色', hex: '#8d4bbb', rgb: [141, 75, 187], cmyk: [25, 60, 0, 27], family: '紫', pinyin: 'zǐsè' },
  { name: '青莲', hex: '#801dae', rgb: [128, 29, 174], cmyk: [26, 83, 0, 32], family: '紫', pinyin: 'qīnglián' },
  { name: '绛紫', hex: '#8c4356', rgb: [140, 67, 86], cmyk: [0, 52, 39, 45], family: '紫', pinyin: 'jiàngzǐ' },
  { name: '紫棠', hex: '#56004f', rgb: [86, 0, 79], cmyk: [0, 100, 8, 66], family: '紫', pinyin: 'zǐtáng' },
  { name: '黛', hex: '#4a4266', rgb: [74, 66, 102], cmyk: [27, 35, 0, 60], family: '紫', pinyin: 'dài' },
  { name: '黛紫', hex: '#574266', rgb: [87, 66, 102], cmyk: [15, 35, 0, 60], family: '紫', pinyin: 'dàizǐ' },
  { name: '紫酱', hex: '#815463', rgb: [129, 84, 99], cmyk: [0, 35, 23, 49], family: '紫', pinyin: 'zǐjiàng' },
  { name: '酱紫', hex: '#815476', rgb: [129, 84, 118], cmyk: [0, 35, 9, 49], family: '紫', pinyin: 'jiàngzǐ' },
  { name: '雪青', hex: '#b0a4e3', rgb: [176, 164, 227], cmyk: [22, 28, 0, 11], family: '紫', pinyin: 'xuěqīng' },
  { name: '丁香色', hex: '#cca4e3', rgb: [204, 164, 227], cmyk: [10, 28, 0, 11], family: '紫', pinyin: 'dīngxiāngsè' },
  { name: '藕荷色', hex: '#e4c6d0', rgb: [228, 198, 208], cmyk: [0, 13, 9, 11], family: '紫', pinyin: 'ǒuhésè' },
  { name: '藕色', hex: '#edd1d8', rgb: [237, 209, 216], cmyk: [0, 12, 9, 7], family: '紫', pinyin: 'ǒusè' },
  { name: '乌色', hex: '#725e82', rgb: [114, 94, 130], cmyk: [12, 28, 0, 49], family: '紫', pinyin: 'wūsè' },
  { name: '栗色', hex: '#60281e', rgb: [96, 40, 30], cmyk: [0, 58, 69, 62], family: '褐', pinyin: 'lìsè' },
  { name: '茶色', hex: '#b35c44', rgb: [179, 92, 68], cmyk: [0, 49, 62, 30], family: '褐', pinyin: 'chásè' },
  { name: '驼色', hex: '#a88462', rgb: [168, 132, 98], cmyk: [0, 21, 42, 34], family: '褐', pinyin: 'tuósè' },
  { name: '棕色', hex: '#b25d25', rgb: [178, 93, 37], cmyk: [0, 48, 79, 30], family: '褐', pinyin: 'zōngsè' },
  { name: '棕红', hex: '#9b4400', rgb: [155, 68, 0], cmyk: [0, 56, 100, 39], family: '褐', pinyin: 'zōnghóng' },
  { name: '棕黄', hex: '#ae7000', rgb: [174, 112, 0], cmyk: [0, 36, 100, 32], family: '褐', pinyin: 'zōnghuáng' },
  { name: '棕黑', hex: '#7c4b00', rgb: [124, 75, 0], cmyk: [0, 40, 100, 51], family: '褐', pinyin: 'zōnghēi' },
  { name: '棕绿', hex: '#827100', rgb: [130, 113, 0], cmyk: [0, 13, 100, 49], family: '褐', pinyin: 'zōnglǜ' },
  { name: '赭', hex: '#9c5333', rgb: [156, 83, 51], cmyk: [0, 47, 67, 39], family: '褐', pinyin: 'zhě' },
  { name: '赭色', hex: '#955539', rgb: [149, 85, 57], cmyk: [0, 43, 62, 42], family: '褐', pinyin: 'zhěsè' },
  { name: '褐色', hex: '#6e511e', rgb: [110, 81, 30], cmyk: [0, 26, 73, 57], family: '褐', pinyin: 'hèsè' },
  { name: '秋色', hex: '#896c39', rgb: [137, 108, 57], cmyk: [0, 21, 58, 46], family: '褐', pinyin: 'qiūsè' },
  { name: '檀', hex: '#b36d61', rgb: [179, 109, 97], cmyk: [0, 39, 46, 30], family: '褐', pinyin: 'tán' },
  { name: '绾', hex: '#a98175', rgb: [169, 129, 117], cmyk: [0, 24, 31, 34], family: '褐', pinyin: 'wǎn' },
  { name: '紫檀', hex: '#4c221b', rgb: [76, 34, 27], cmyk: [0, 55, 64, 70], family: '褐', pinyin: 'zǐtán' },
  { name: '苍黄', hex: '#a29b7c', rgb: [162, 155, 124], cmyk: [0, 4, 23, 36], family: '褐', pinyin: 'cānghuáng' },
  { name: '灰色', hex: '#808080', rgb: [128, 128, 128], cmyk: [0, 0, 0, 50], family: '灰', pinyin: 'huīsè' },
  { name: '苍色', hex: '#75878a', rgb: [117, 135, 138], cmyk: [15, 2, 0, 46], family: '灰', pinyin: 'cāngsè' },
  { name: '苍白', hex: '#d1d9e0', rgb: [209, 217, 224], cmyk: [7, 3, 0, 12], family: '灰', pinyin: 'cāngbái' },
  { name: '蓝灰色', hex: '#a1afc9', rgb: [161, 175, 201], cmyk: [20, 13, 0, 21], family: '灰', pinyin: 'lánhuīsè' },
  { name: '墨灰', hex: '#758a99', rgb: [117, 138, 153], cmyk: [24, 10, 0, 40], family: '灰', pinyin: 'mòhuī' },
  { name: '花白', hex: '#c2ccd0', rgb: [194, 204, 208], cmyk: [7, 2, 0, 18], family: '灰', pinyin: 'huābái' },
  { name: '老银', hex: '#bacac6', rgb: [186, 202, 198], cmyk: [8, 0, 2, 21], family: '灰', pinyin: 'lǎoyín' },
  { name: '精白', hex: '#ffffff', rgb: [255, 255, 255], cmyk: [0, 0, 0, 0], family: '黑白', pinyin: 'jīngbái' },
  { name: '雪白', hex: '#f2fdff', rgb: [242, 253, 255], cmyk: [5, 1, 0, 0], family: '黑白', pinyin: 'xuěbái' },
  { name: '象牙白', hex: '#fffbf0', rgb: [255, 251, 240], cmyk: [0, 2, 6, 0], family: '黑白', pinyin: 'xiàngyábái' },
  { name: '月白', hex: '#d6ecf0', rgb: [214, 236, 240], cmyk: [11, 2, 0, 6], family: '黑白', pinyin: 'yuèbái' },
  { name: '荼白', hex: '#f3f9f1', rgb: [243, 249, 241], cmyk: [2, 0, 3, 2], family: '黑白', pinyin: 'túbái' },
  { name: '缟', hex: '#f2ecde', rgb: [242, 236, 222], cmyk: [0, 2, 8, 5], family: '黑白', pinyin: 'gǎo' },
  { name: '素', hex: '#e0f0e9', rgb: [224, 240, 233], cmyk: [7, 0, 3, 6], family: '黑白', pinyin: 'sù' },
  { name: '霜色', hex: '#e9f1f6', rgb: [233, 241, 246], cmyk: [5, 2, 0, 4], family: '黑白', pinyin: 'shuāngsè' },
  { name: '鱼肚白', hex: '#fcefe8', rgb: [252, 239, 232], cmyk: [0, 5, 8, 1], family: '黑白', pinyin: 'yúdùbái' },
  { name: '莹白', hex: '#e3f9fd', rgb: [227, 249, 253], cmyk: [10, 2, 0, 1], family: '黑白', pinyin: 'yíngbái' },
  { name: '铅白', hex: '#f0f0f4', rgb: [240, 240, 244], cmyk: [2, 2, 0, 4], family: '黑白', pinyin: 'qiānbái' },
  { name: '银白', hex: '#e9e7ef', rgb: [233, 231, 239], cmyk: [3, 3, 0, 6], family: '黑白', pinyin: 'yínbái' },
  { name: '牙色', hex: '#eedeb0', rgb: [238, 222, 176], cmyk: [0, 7, 26, 7], family: '黑白', pinyin: 'yásè' },
  { name: '黑色', hex: '#000000', rgb: [0, 0, 0], cmyk: [0, 0, 0, 100], family: '黑白', pinyin: 'hēisè' },
  { name: '漆黑', hex: '#161823', rgb: [22, 24, 35], cmyk: [37, 31, 0, 86], family: '黑白', pinyin: 'qīhēi' },
  { name: '乌黑', hex: '#392f41', rgb: [57, 47, 65], cmyk: [12, 28, 0, 75], family: '黑白', pinyin: 'wūhēi' },
  { name: '玄色', hex: '#622a1d', rgb: [98, 42, 29], cmyk: [0, 57, 70, 62], family: '黑白', pinyin: 'xuánsè' },
  { name: '玄青', hex: '#3d3b4f', rgb: [61, 59, 79], cmyk: [23, 25, 0, 69], family: '黑白', pinyin: 'xuánqīng' },
  { name: '墨色', hex: '#50616d', rgb: [80, 97, 109], cmyk: [27, 11, 0, 57], family: '黑白', pinyin: 'mòsè' },
  { name: '缁色', hex: '#493131', rgb: [73, 49, 49], cmyk: [0, 33, 33, 71], family: '黑白', pinyin: 'zīsè' },
  { name: '煤黑', hex: '#312520', rgb: [49, 37, 32], cmyk: [0, 24, 35, 81], family: '黑白', pinyin: 'méihēi' },
  { name: '黧', hex: '#5d513c', rgb: [93, 81, 60], cmyk: [0, 13, 35, 64], family: '黑白', pinyin: 'lí' },
  { name: '黎', hex: '#75664d', rgb: [117, 102, 77], cmyk: [0, 13, 34, 54], family: '黑白', pinyin: 'lí' },
  { name: '黝', hex: '#6b6882', rgb: [107, 104, 130], cmyk: [18, 20, 0, 49], family: '黑白', pinyin: 'yǒu' },
  { name: '黝黑', hex: '#665757', rgb: [102, 87, 87], cmyk: [0, 15, 15, 60], family: '黑白', pinyin: 'yǒuhēi' },
  { name: '黯', hex: '#41555d', rgb: [65, 85, 93], cmyk: [30, 9, 0, 64], family: '黑白', pinyin: 'àn' },
  { name: '鸦青', hex: '#424c50', rgb: [66, 76, 80], cmyk: [18, 5, 0, 69], family: '黑白', pinyin: 'yāqīng' },
  { name: '苍黑', hex: '#395260', rgb: [57, 82, 96], cmyk: [41, 15, 0, 62], family: '黑白', pinyin: 'cānghēi' },
];

/** 色系筛选顺序（与数据 family 一一对应，设计稿 2.1） */
export const COLOR_FAMILIES = ['红', '橙', '黄', '绿', '青', '蓝', '紫', '褐', '灰', '黑白'] as const;

/** 按色名查色（收藏/配色只存色名引用，渲染与复制都经这里取色值；查不到返回 undefined） */
const COLOR_BY_NAME = new Map(TRADITIONAL_COLORS.map((c) => [c.name, c]));
export function colorByName(name: string): TraditionalColor | undefined {
  return COLOR_BY_NAME.get(name);
}

/** 色值显示/复制格式（工作区全局三段切换，设计稿 1.3） */
export type ColorFormat = 'hex' | 'rgb' | 'cmyk';

/** 按当前格式取一个色的文本值：HEX 大写带 #、RGB 逗号分隔、CMYK 带 % 的四值 */
export function colorValueOf(c: TraditionalColor, format: ColorFormat): string {
  if (format === 'rgb') return `rgb(${c.rgb[0]}, ${c.rgb[1]}, ${c.rgb[2]})`;
  if (format === 'cmyk') return `cmyk(${c.cmyk[0]}%, ${c.cmyk[1]}%, ${c.cmyk[2]}%, ${c.cmyk[3]}%)`;
  return c.hex.toUpperCase();
}

/** 拼音去声调（搜索用：yanzhi 要能命中 yānzhī；NFD 拆组合符后剥掉附加符） */
export function stripTones(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** 色块上的文字色：按相对亮度在黑/白间取对比更高的一侧（设计稿 8：白字压浅色块防呆） */
export function readableTextOn(c: TraditionalColor): '#111111' | '#ffffff' {
  const [r, g, b] = c.rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.35 ? '#111111' : '#ffffff';
}

/** 当日配色（设计稿 1.1）：按本地日期取模轮换，全站同日同组、零随机漂移 */
export function dailyPalette(date = new Date()): TraditionalPalette {
  const days = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  return TRADITIONAL_PALETTES[((days % TRADITIONAL_PALETTES.length) + TRADITIONAL_PALETTES.length) % TRADITIONAL_PALETTES.length];
}

/** 当日一色（1 栏 × 2 高卡面详情用）：与当日配色同源的日期取模，落在全库上 */
export function dailyColor(date = new Date()): TraditionalColor {
  const days = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  return TRADITIONAL_COLORS[((days % TRADITIONAL_COLORS.length) + TRADITIONAL_COLORS.length) % TRADITIONAL_COLORS.length];
}

/** 内置传统配色（设计稿第 5 节，v1 共 9 组）：只存色名引用，色值以 TRADITIONAL_COLORS 为准 */
export interface TraditionalPalette {
  name: string;
  note: string;
  colors: string[];
}

export const TRADITIONAL_PALETTES: TraditionalPalette[] = [
  { name: '青花瓷', note: '磁州窑青花，蓝白之间', colors: ['群青', '花青', '黛蓝', '月白'] },
  { name: '金阙宫墙', note: '宫墙红与鎏金', colors: ['大红', '朱砂', '赤金', '玄青'] },
  { name: '千里江山', note: '王希孟《千里江山图》矿物色', colors: ['石青', '青翠', '群青', '松柏绿'] },
  { name: '敦煌', note: '莫高窟壁画土色谱', colors: ['赭色', '石青', '秋香色', '绛紫'] },
  { name: '桃夭', note: '《红楼梦》松花配桃红', colors: ['松花色', '桃红', '妃色', '艾绿'] },
  { name: '江南烟雨', note: '水墨江南的灰青调', colors: ['鸭卵青', '蟹壳青', '墨色', '荼白'] },
  { name: '藕荷', note: '夏日浅紫', colors: ['藕荷色', '丁香色', '雪青', '水绿'] },
  { name: '丹枫', note: '秋山层林', colors: ['酡红', '琥珀', '枯黄', '栗色'] },
  { name: '墨竹', note: '文人竹石', colors: ['墨色', '竹青', '黛绿', '缟'] },
];
