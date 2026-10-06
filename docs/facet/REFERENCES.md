# FACET — 视觉与材质参考

本文件记录设计依据，方便继续调整切面、材质与展陈。参考网页中的摄影、图表与博物馆图片仅用于研究，未作为素材随本作品分发。网站的程序化宝石与光学表现是独立创作。

## 1. 宝石与光的依据

| 主题 | 一手来源 | 参考要点与设计用法 |
| --- | --- | --- |
| 钻石切面 | [GIA — Diamond Cut](https://4cs.gia.edu/en-us/diamond-cut/)；[GIA — Diamond Anatomy](https://4cs.gia.edu/en-us/blog/diamond-anatomy-explained/) | 标准圆明亮式切割可区分台面、冠部、腰部与亭部。GIA 所述的标准形式有 57 或 58 个切面。网站展示的切面数量应以自身几何数据为准，不把渲染三角形数量当成切面数量。 |
| 钻石光感 | [GIA — Cut](https://www.gia.edu/gia-about/4cs-cut)；[GIA — Diamond](https://www.gia.edu/diamond) | 明亮度对应白光的返回；火彩对应光谱色散；闪烁包含随运动变化的明暗图案。GIA 给出的钻石折射率约为 2.42。视觉主体应是清楚的明暗切面与白色高光，彩色闪光只在适合的角度出现。 |
| 晶体形态 | [GIA — Diamond Description](https://www.gia.edu/diamond-description) | 常见的宝石级钻石原晶形态是八面体。若明确表现钻石原晶，应避免直接使用石英式长柱尖晶；展览中的独立水晶可以采用自身的柱状晶体语言。 |
| 红宝石 | [GIA — Ruby Description](https://www.gia.edu/ruby-description)；[GIA — Ruby](https://www.gia.edu/ruby) | 红宝石属于刚玉，铬与其红色有关；荧光会受到成分与照明条件影响。折射率为 1.762–1.770。画面采用深红内部、透光红色与明亮表面反射之间的层次，避免把整颗宝石处理为自发光物体。 |
| 蓝宝石 | [GIA — Sapphire Description](https://www.gia.edu/sapphire-description)；[GIA — Sapphire](https://www.gia.edu/sapphire) | 蓝色刚玉的颜色与铁、钛有关；蓝色可偏绿或偏紫。折射率同为 1.762–1.770。红、蓝宝石使用阶梯式切割的共同构图语言，通过吸收色与光的位置表达差别。 |
| 翡翠与玉感 | [GIA — Jadeite Jade Quality Factors](https://www.gia.edu/jade-quality-factor) | 半透明翡翠会使透过它观察到的文字略微模糊，晶粒结构与抛光也参与表面观感。因此玉石使用独立的圆润形体、内部云絮、厚度感与柔和透光，不能只把透明切面模型染绿。 |
| 玛瑙纹层 | [Smithsonian — Agate](https://naturalhistory.si.edu/explore/collections/geogallery/10026005)；[Smithsonian — Quartz, var. agate](https://naturalhistory.si.edu/explore/collections/geogallery/10026355) | 玛瑙是具有条带的玉髓，常见同心纹带、半透明与蜡状质感。常见颜色包括白、灰、黄褐与红褐。程序纹理采用有机偏心、不同宽度与细小扰动，切片保留实体厚度，避免规则靶环或平面彩虹条纹。 |

## 2. 展陈与照明参考

- [Ralph Appelbaum Associates — AMNH Mignone Halls](https://raai.com/project/allison-and-roberto-mignone-halls-of-gems-and-minerals-american-museum-of-natural-history/)：展陈设计方的一手项目说明。参考定制展柜、宝石的独立空间，以及针对色彩、折射和雕塑形态安排的照明。
- [IES — Mignone Halls lighting project sheet](https://iesnyc.org/images/downloads/Lumen_2022/lumen2022_mignonehall.pdf)：参考低环境亮度、局部主光与辅助光之间的分工。借鉴的是光的层级，不复制展厅布局。
- [Smithsonian — Geology, Gems and Minerals Hall](https://naturalhistory.si.edu/exhibits/janet-annenberg-hooker-hall-geology-gems-and-minerals)：参考单件展品的观看距离、留白与独立存在感。FACET 的叙事仍围绕宝石与光，不延伸为地质形成科普。

对应的设计原则：环境保持安静中性；反射中的白光与暗旗塑造切面；材质承担主要色彩；底座、文字与辅助线服务于观看。火彩只占局部，不以全屏辉光代替折射与明暗结构。

## 3. 实时光学的边界

FACET 是艺术化的实时展览，不是宝石鉴定、切割评级或经标定的光学仪器。

切面材质在自身的凸多面体边界上进行有限次光线求交，包含入射折射、Fresnel 反射、内部反射与路径长度吸收。色散使用共享内部路径的 RGB 出射方向近似；它不等同于对完整可见光谱进行路径追踪。虚拟摄影棚、有限反射次数及末端光量估计也属于展览着色器的取舍。相关实现见 [gemMaterial.ts](../../experiences/facet/src/scene/gemMaterial.ts)。

抛光以同一模型上的连续表面变化表达；切面拆解、剖切与宝石之间的转变是展示方法，不代表实际加工工序或矿物转化。玉石的透光、内部云絮与玛瑙纹带采用各自的程序近似，不宣称复原特定天然标本。相关形体与材质见 [gemGeometry.ts](../../experiences/facet/src/scene/gemGeometry.ts) 与 [organicStones.ts](../../experiences/facet/src/scene/organicStones.ts)。

## 4. 素材使用与后续替换

GIA 页面中的摄影可能另有摄影师或所有者署名，本参考清单不提供这些图片的再分发许可。博物馆页面也应逐件核对素材权利，不能仅凭域名判断能否使用。

如后续需要加入真实标本图，可从 [Smithsonian Open Access](https://www.si.edu/openaccess) 查找明确标为 CC0 的单件媒体，并记录原始对象链接。使用规则见 [Open Access FAQ](https://www.si.edu/openaccess/faq)。已核对的候选包括 [玛瑙 NMNH C6052](https://naturalhistory.si.edu/object/nmnhmineralsciences_1154797?geogallery=Quartz+%28var.+agate%29&node=14399) 与 [火玛瑙 NMNH G10006](https://naturalhistory.si.edu/object/nmnhmineralsciences_1000007)；这些候选图片未随本作品分发，火玛瑙也不应替代普通条带玛瑙的材质依据。
