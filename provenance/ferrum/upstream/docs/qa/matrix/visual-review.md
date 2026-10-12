# FERRUM 最终截图矩阵：逐图审查

**108/108 张已实际查看，通过本次布局与场景可见性审查；未留下必须修改或待判断的视觉候选。**

本记录对应修复穿砧和水面硬边后的新矩阵。此前终止的 85 张不计入本次通过数量，也没有继承此前的逐图通过结论。

## 证据与范围

- [可移植的捕获数据](capture-results.json)：逐图状态、renderer diagnostics、DOM 文字/控制边界及源码 SHA。
- [图像清单](evidence-manifest.json)：每张原图的 SHA、格式、尺寸和机械校验。
- [逐图结构化结论](visual-review.json)：108 条已审记录与逐图观察。

36 张三阶段完整画幅 strips 已逐一打开，作为内部审查资料，不随交付附带；原穿砧、水面边缘与大标题边界等具体位置另外使用原尺寸图核对。每条交付记录直接链接对应原图，六张总览一并提供。标题、正文、固定控制、连续器物轮廓、空白/灰白占位及离散 handoff 关系均在范围内。

## 矩阵

| 视口 | 原图 | 已审 | 结论 | Contact sheet |
| --- | ---: | ---: | --- | --- |
| 360x780 | 18 | 18 | 通过 | [360x780](contact-sheets/360x780.jpg) |
| 390x844 | 18 | 18 | 通过 | [390x844](contact-sheets/390x844.jpg) |
| 768x1024 | 18 | 18 | 通过 | [768x1024](contact-sheets/768x1024.jpg) |
| 1440x900 | 18 | 18 | 通过 | [1440x900](contact-sheets/1440x900.jpg) |
| 1920x1080 | 18 | 18 | 通过 | [1920x1080](contact-sheets/1920x1080.jpg) |
| 3840x2160 | 18 | 18 | 通过 | [3840x2160](contact-sheets/3840x2160.jpg) |

## 两项真实问题的关闭

**穿砧：** 768×1024 的 Strike handoff 中，旧暗尾端现与热主体连贯，砧面处于下方；全尺寸 hold / handoff 和下一幕 enter 均重新查看，没有新的遮挡或字幕回归。

**有限水面硬边：** 1440、1920 和 4K 的冷却三阶段不再出现原先两侧的硬斜边。局部碎反射、接触雾以及浸入水下的变暗金属段保留。

**自动边框候选：** 6 张首幕的 masthead 容器与标题外框发生 padding 重叠，已目视确认字形与按钮没有碰撞；逐条排除记录在 JSON 中。没有文字或控制超出视口，没有横向页面溢出。

## 捕获批次与恢复说明

本次最终 108 张来自两批同源捕获：首次捕获完成前五个尺寸的 90 张；4K 首次完成 6 张后，Strike enter 的截图步骤超过工具默认 30 秒上限。只将截图等待上限改为 120 秒后，以全新浏览器完整复拍 4K 的 18 张，并取代该尺寸先前 6 张。

两批的页面源码 SHA 完全相同，视口、画质、DPR、就绪条件、幕索引和截屏前后状态检查均保持一致。首次超时属于已恢复的捕获工具失败，不能描述为一次完整运行全部通过。成功选择集没有未解决的捕获错误；[紧凑批次记录](capture-attempts.json) 保留两批来源、事件及原始报告 SHA。首次原始报告、重拍报告及替换前六张 4K 图只作内部归档，不随交付附带。

## 适用边界

这是离散状态的视觉验收，不能替代所有中间帧和真实设备交互测试。软件 Chromium 的截图不代表硬件帧率。所有 JPEG 使用原 viewport 尺寸；4K 场景内部会按像素预算限制 canvas drawing buffer，实际数值保留在 diagnostics 中。

## 每张审查记录

| 原图 | 结论 | 观察 |
| --- | --- | --- |
| [360x780/00-before-form-enter.jpg](360x780/00-before-form-enter.jpg) | 已审 / 通过 | 首屏铭文与冷坯完整，正文、向下邀请及固定导航没有互相遮挡。 |
| [360x780/00-before-form-hold.jpg](360x780/00-before-form-hold.jpg) | 已审 / 通过 | 冷坯稳定停留，标题与页脚留白完整；没有空白或占位画面。 |
| [360x780/00-before-form-handoff.jpg](360x780/00-before-form-handoff.jpg) | 已审 / 通过 | 标题渐淡，坯体旋转并开始转热，器物持续可见；与炉火进入样本相容。 |
| [360x780/01-furnace-enter.jpg](360x780/01-furnace-enter.jpg) | 已审 / 通过 | 炉炭与局部热区建立，器物持续可见，标题及说明文字完整。 |
| [360x780/01-furnace-hold.jpg](360x780/01-furnace-hold.jpg) | 已审 / 通过 | 热核心与氧化斑可辨，炉区没有遮挡标题、正文或底部控制。 |
| [360x780/01-furnace-handoff.jpg](360x780/01-furnace-handoff.jpg) | 已审 / 通过 | 器物转向力量场景，热轮廓可辨，锤影进入背景时没有空白或额外断片。 |
| [360x780/02-strike-enter.jpg](360x780/02-strike-enter.jpg) | 已审 / 通过 | 热坯与砧面可辨，锤击进入取景未遮挡文字和固定控制。 |
| [360x780/02-strike-hold.jpg](360x780/02-strike-hold.jpg) | 已审 / 通过 | 锤坯接触及少量火星可读，说明文字与控制保持清楚，修复没有改变接触观感。 |
| [360x780/02-strike-handoff.jpg](360x780/02-strike-handoff.jpg) | 已审 / 通过 | 暗尾端与热主体连续，砧面保持在其下方；原穿砧造成的分离片不再出现；右端暂延出手机视口属于过渡取景，未形成分离段。 |
| [360x780/03-temperature-enter.jpg](360x780/03-temperature-enter.jpg) | 已审 / 通过 | 余热器物连续进入局部水线，退出砧体没有切断主体；两行标题完整。 |
| [360x780/03-temperature-hold.jpg](360x780/03-temperature-hold.jpg) | 已审 / 通过 | 局部水光和薄雾保留，水域边缘融入暗场；浸入部分为连续器物的变暗段。 |
| [360x780/03-temperature-handoff.jpg](360x780/03-temperature-handoff.jpg) | 已审 / 通过 | 冷态轮廓进入近景，水域没有硬斜边，标题、说明及控制保持完整。 |
| [360x780/04-edge-enter.jpg](360x780/04-edge-enter.jpg) | 已审 / 通过 | 微表面近景中的长轴与主棱线连续，文字位于暗区，没有被高光遮住；取景裁切部分右端属于材料特写；可见金属仍连续，终章恢复全览。 |
| [360x780/04-edge-hold.jpg](360x780/04-edge-hold.jpg) | 已审 / 通过 | 材料分区和反射可读；说明文字与固定导航没有碰撞；取景裁切部分右端属于材料特写；可见金属仍连续，终章恢复全览。 |
| [360x780/04-edge-handoff.jpg](360x780/04-edge-handoff.jpg) | 已审 / 通过 | 反射收束时器物仍连续可见，没有灰白占位或空白；与终章全览样本相容；取景裁切部分右端属于材料特写；可见金属仍连续，终章恢复全览。 |
| [360x780/05-relic-enter.jpg](360x780/05-relic-enter.jpg) | 已审 / 通过 | 终章拉回完整器物，标题、结语和重看入口保有空间。 |
| [360x780/05-relic-hold.jpg](360x780/05-relic-hold.jpg) | 已审 / 通过 | 完整冷态轮廓稳定可见，结语与 Experience again 入口清楚。 |
| [360x780/05-relic-handoff.jpg](360x780/05-relic-handoff.jpg) | 已审 / 通过 | 终点保持完整冷态画面和重看入口，固定导航仍可辨，没有空帧。 |
| [390x844/00-before-form-enter.jpg](390x844/00-before-form-enter.jpg) | 已审 / 通过 | 首屏铭文与冷坯完整，正文、向下邀请及固定导航没有互相遮挡。 |
| [390x844/00-before-form-hold.jpg](390x844/00-before-form-hold.jpg) | 已审 / 通过 | 冷坯稳定停留，标题与页脚留白完整；没有空白或占位画面。 |
| [390x844/00-before-form-handoff.jpg](390x844/00-before-form-handoff.jpg) | 已审 / 通过 | 标题渐淡，坯体旋转并开始转热，器物持续可见；与炉火进入样本相容。 |
| [390x844/01-furnace-enter.jpg](390x844/01-furnace-enter.jpg) | 已审 / 通过 | 炉炭与局部热区建立，器物持续可见，标题及说明文字完整。 |
| [390x844/01-furnace-hold.jpg](390x844/01-furnace-hold.jpg) | 已审 / 通过 | 热核心与氧化斑可辨，炉区没有遮挡标题、正文或底部控制。 |
| [390x844/01-furnace-handoff.jpg](390x844/01-furnace-handoff.jpg) | 已审 / 通过 | 器物转向力量场景，热轮廓可辨，锤影进入背景时没有空白或额外断片。 |
| [390x844/02-strike-enter.jpg](390x844/02-strike-enter.jpg) | 已审 / 通过 | 热坯与砧面可辨，锤击进入取景未遮挡文字和固定控制。 |
| [390x844/02-strike-hold.jpg](390x844/02-strike-hold.jpg) | 已审 / 通过 | 锤坯接触及少量火星可读，说明文字与控制保持清楚，修复没有改变接触观感。 |
| [390x844/02-strike-handoff.jpg](390x844/02-strike-handoff.jpg) | 已审 / 通过 | 暗尾端与热主体连续，砧面保持在其下方；原穿砧造成的分离片不再出现；右端暂延出手机视口属于过渡取景，未形成分离段。 |
| [390x844/03-temperature-enter.jpg](390x844/03-temperature-enter.jpg) | 已审 / 通过 | 余热器物连续进入局部水线，退出砧体没有切断主体；两行标题完整。 |
| [390x844/03-temperature-hold.jpg](390x844/03-temperature-hold.jpg) | 已审 / 通过 | 局部水光和薄雾保留，水域边缘融入暗场；浸入部分为连续器物的变暗段。 |
| [390x844/03-temperature-handoff.jpg](390x844/03-temperature-handoff.jpg) | 已审 / 通过 | 冷态轮廓进入近景，水域没有硬斜边，标题、说明及控制保持完整。 |
| [390x844/04-edge-enter.jpg](390x844/04-edge-enter.jpg) | 已审 / 通过 | 微表面近景中的长轴与主棱线连续，文字位于暗区，没有被高光遮住；取景裁切部分右端属于材料特写；可见金属仍连续，终章恢复全览。 |
| [390x844/04-edge-hold.jpg](390x844/04-edge-hold.jpg) | 已审 / 通过 | 材料分区和反射可读；说明文字与固定导航没有碰撞；取景裁切部分右端属于材料特写；可见金属仍连续，终章恢复全览。 |
| [390x844/04-edge-handoff.jpg](390x844/04-edge-handoff.jpg) | 已审 / 通过 | 反射收束时器物仍连续可见，没有灰白占位或空白；与终章全览样本相容；取景裁切部分右端属于材料特写；可见金属仍连续，终章恢复全览。 |
| [390x844/05-relic-enter.jpg](390x844/05-relic-enter.jpg) | 已审 / 通过 | 终章拉回完整器物，标题、结语和重看入口保有空间。 |
| [390x844/05-relic-hold.jpg](390x844/05-relic-hold.jpg) | 已审 / 通过 | 完整冷态轮廓稳定可见，结语与 Experience again 入口清楚。 |
| [390x844/05-relic-handoff.jpg](390x844/05-relic-handoff.jpg) | 已审 / 通过 | 终点保持完整冷态画面和重看入口，固定导航仍可辨，没有空帧。 |
| [768x1024/00-before-form-enter.jpg](768x1024/00-before-form-enter.jpg) | 已审 / 通过 | 首屏铭文与冷坯完整，正文、向下邀请及固定导航没有互相遮挡。 |
| [768x1024/00-before-form-hold.jpg](768x1024/00-before-form-hold.jpg) | 已审 / 通过 | 冷坯稳定停留，标题与页脚留白完整；没有空白或占位画面。 |
| [768x1024/00-before-form-handoff.jpg](768x1024/00-before-form-handoff.jpg) | 已审 / 通过 | 标题渐淡，坯体旋转并开始转热，器物持续可见；与炉火进入样本相容。 |
| [768x1024/01-furnace-enter.jpg](768x1024/01-furnace-enter.jpg) | 已审 / 通过 | 炉炭与局部热区建立，器物持续可见，标题及说明文字完整。 |
| [768x1024/01-furnace-hold.jpg](768x1024/01-furnace-hold.jpg) | 已审 / 通过 | 热核心与氧化斑可辨，炉区没有遮挡标题、正文或底部控制。 |
| [768x1024/01-furnace-handoff.jpg](768x1024/01-furnace-handoff.jpg) | 已审 / 通过 | 器物转向力量场景，热轮廓可辨，锤影进入背景时没有空白或额外断片。 |
| [768x1024/02-strike-enter.jpg](768x1024/02-strike-enter.jpg) | 已审 / 通过 | 热坯与砧面可辨，锤击进入取景未遮挡文字和固定控制。 |
| [768x1024/02-strike-hold.jpg](768x1024/02-strike-hold.jpg) | 已审 / 通过 | 锤坯接触及少量火星可读，说明文字与控制保持清楚，修复没有改变接触观感。 |
| [768x1024/02-strike-handoff.jpg](768x1024/02-strike-handoff.jpg) | 已审 / 通过 | 暗尾端与热主体连续，砧面保持在其下方；原穿砧造成的分离片不再出现。 |
| [768x1024/03-temperature-enter.jpg](768x1024/03-temperature-enter.jpg) | 已审 / 通过 | 余热器物连续进入局部水线，退出砧体没有切断主体；两行标题完整。 |
| [768x1024/03-temperature-hold.jpg](768x1024/03-temperature-hold.jpg) | 已审 / 通过 | 局部水光和薄雾保留，水域边缘融入暗场；浸入部分为连续器物的变暗段。 |
| [768x1024/03-temperature-handoff.jpg](768x1024/03-temperature-handoff.jpg) | 已审 / 通过 | 冷态轮廓进入近景，水域没有硬斜边，标题、说明及控制保持完整。 |
| [768x1024/04-edge-enter.jpg](768x1024/04-edge-enter.jpg) | 已审 / 通过 | 微表面近景中的长轴与主棱线连续，文字位于暗区，没有被高光遮住；平板构图中尖端与下端均保留在视口内。 |
| [768x1024/04-edge-hold.jpg](768x1024/04-edge-hold.jpg) | 已审 / 通过 | 材料分区和反射可读；说明文字与固定导航没有碰撞；平板构图中尖端与下端均保留在视口内。 |
| [768x1024/04-edge-handoff.jpg](768x1024/04-edge-handoff.jpg) | 已审 / 通过 | 反射收束时器物仍连续可见，没有灰白占位或空白；与终章全览样本相容；平板构图中尖端与下端均保留在视口内。 |
| [768x1024/05-relic-enter.jpg](768x1024/05-relic-enter.jpg) | 已审 / 通过 | 终章拉回完整器物，标题、结语和重看入口保有空间。 |
| [768x1024/05-relic-hold.jpg](768x1024/05-relic-hold.jpg) | 已审 / 通过 | 完整冷态轮廓稳定可见，结语与 Experience again 入口清楚。 |
| [768x1024/05-relic-handoff.jpg](768x1024/05-relic-handoff.jpg) | 已审 / 通过 | 终点保持完整冷态画面和重看入口，固定导航仍可辨，没有空帧。 |
| [1440x900/00-before-form-enter.jpg](1440x900/00-before-form-enter.jpg) | 已审 / 通过 | 首屏铭文与冷坯完整，正文、向下邀请及固定导航没有互相遮挡；已目视排除自动容器重叠候选：masthead 内边距与标题框相交，但实际字形和按钮之间有空隙。 |
| [1440x900/00-before-form-hold.jpg](1440x900/00-before-form-hold.jpg) | 已审 / 通过 | 冷坯稳定停留，标题与页脚留白完整；没有空白或占位画面；已目视排除自动容器重叠候选：masthead 内边距与标题框相交，但实际字形和按钮之间有空隙。 |
| [1440x900/00-before-form-handoff.jpg](1440x900/00-before-form-handoff.jpg) | 已审 / 通过 | 标题渐淡，坯体旋转并开始转热，器物持续可见；与炉火进入样本相容；已目视排除自动容器重叠候选：masthead 内边距与标题框相交，但实际字形和按钮之间有空隙。 |
| [1440x900/01-furnace-enter.jpg](1440x900/01-furnace-enter.jpg) | 已审 / 通过 | 炉炭与局部热区建立，器物持续可见，标题及说明文字完整。 |
| [1440x900/01-furnace-hold.jpg](1440x900/01-furnace-hold.jpg) | 已审 / 通过 | 热核心与氧化斑可辨，炉区没有遮挡标题、正文或底部控制。 |
| [1440x900/01-furnace-handoff.jpg](1440x900/01-furnace-handoff.jpg) | 已审 / 通过 | 器物转向力量场景，热轮廓可辨，锤影进入背景时没有空白或额外断片。 |
| [1440x900/02-strike-enter.jpg](1440x900/02-strike-enter.jpg) | 已审 / 通过 | 热坯与砧面可辨，锤击进入取景未遮挡文字和固定控制。 |
| [1440x900/02-strike-hold.jpg](1440x900/02-strike-hold.jpg) | 已审 / 通过 | 锤坯接触及少量火星可读，说明文字与控制保持清楚，修复没有改变接触观感。 |
| [1440x900/02-strike-handoff.jpg](1440x900/02-strike-handoff.jpg) | 已审 / 通过 | 暗尾端与热主体连续，砧面保持在其下方；原穿砧造成的分离片不再出现。 |
| [1440x900/03-temperature-enter.jpg](1440x900/03-temperature-enter.jpg) | 已审 / 通过 | 余热器物连续进入局部水线，退出砧体没有切断主体；两行标题完整。 |
| [1440x900/03-temperature-hold.jpg](1440x900/03-temperature-hold.jpg) | 已审 / 通过 | 局部水光和薄雾保留，水域边缘融入暗场；浸入部分为连续器物的变暗段。 |
| [1440x900/03-temperature-handoff.jpg](1440x900/03-temperature-handoff.jpg) | 已审 / 通过 | 冷态轮廓进入近景，水域没有硬斜边，标题、说明及控制保持完整。 |
| [1440x900/04-edge-enter.jpg](1440x900/04-edge-enter.jpg) | 已审 / 通过 | 微表面近景中的长轴与主棱线连续，文字位于暗区，没有被高光遮住；取景裁切部分右端属于材料特写；可见金属仍连续，终章恢复全览。 |
| [1440x900/04-edge-hold.jpg](1440x900/04-edge-hold.jpg) | 已审 / 通过 | 材料分区和反射可读；说明文字与固定导航没有碰撞；取景裁切部分右端属于材料特写；可见金属仍连续，终章恢复全览。 |
| [1440x900/04-edge-handoff.jpg](1440x900/04-edge-handoff.jpg) | 已审 / 通过 | 反射收束时器物仍连续可见，没有灰白占位或空白；与终章全览样本相容；取景裁切部分右端属于材料特写；可见金属仍连续，终章恢复全览。 |
| [1440x900/05-relic-enter.jpg](1440x900/05-relic-enter.jpg) | 已审 / 通过 | 终章拉回完整器物，标题、结语和重看入口保有空间。 |
| [1440x900/05-relic-hold.jpg](1440x900/05-relic-hold.jpg) | 已审 / 通过 | 完整冷态轮廓稳定可见，结语与 Experience again 入口清楚。 |
| [1440x900/05-relic-handoff.jpg](1440x900/05-relic-handoff.jpg) | 已审 / 通过 | 终点保持完整冷态画面和重看入口，固定导航仍可辨，没有空帧。 |
| [1920x1080/00-before-form-enter.jpg](1920x1080/00-before-form-enter.jpg) | 已审 / 通过 | 首屏铭文与冷坯完整，正文、向下邀请及固定导航没有互相遮挡；已目视排除自动容器重叠候选：masthead 内边距与标题框相交，但实际字形和按钮之间有空隙。 |
| [1920x1080/00-before-form-hold.jpg](1920x1080/00-before-form-hold.jpg) | 已审 / 通过 | 冷坯稳定停留，标题与页脚留白完整；没有空白或占位画面；已目视排除自动容器重叠候选：masthead 内边距与标题框相交，但实际字形和按钮之间有空隙。 |
| [1920x1080/00-before-form-handoff.jpg](1920x1080/00-before-form-handoff.jpg) | 已审 / 通过 | 标题渐淡，坯体旋转并开始转热，器物持续可见；与炉火进入样本相容；已目视排除自动容器重叠候选：masthead 内边距与标题框相交，但实际字形和按钮之间有空隙。 |
| [1920x1080/01-furnace-enter.jpg](1920x1080/01-furnace-enter.jpg) | 已审 / 通过 | 炉炭与局部热区建立，器物持续可见，标题及说明文字完整。 |
| [1920x1080/01-furnace-hold.jpg](1920x1080/01-furnace-hold.jpg) | 已审 / 通过 | 热核心与氧化斑可辨，炉区没有遮挡标题、正文或底部控制。 |
| [1920x1080/01-furnace-handoff.jpg](1920x1080/01-furnace-handoff.jpg) | 已审 / 通过 | 器物转向力量场景，热轮廓可辨，锤影进入背景时没有空白或额外断片。 |
| [1920x1080/02-strike-enter.jpg](1920x1080/02-strike-enter.jpg) | 已审 / 通过 | 热坯与砧面可辨，锤击进入取景未遮挡文字和固定控制。 |
| [1920x1080/02-strike-hold.jpg](1920x1080/02-strike-hold.jpg) | 已审 / 通过 | 锤坯接触及少量火星可读，说明文字与控制保持清楚，修复没有改变接触观感。 |
| [1920x1080/02-strike-handoff.jpg](1920x1080/02-strike-handoff.jpg) | 已审 / 通过 | 暗尾端与热主体连续，砧面保持在其下方；原穿砧造成的分离片不再出现。 |
| [1920x1080/03-temperature-enter.jpg](1920x1080/03-temperature-enter.jpg) | 已审 / 通过 | 余热器物连续进入局部水线，退出砧体没有切断主体；两行标题完整。 |
| [1920x1080/03-temperature-hold.jpg](1920x1080/03-temperature-hold.jpg) | 已审 / 通过 | 局部水光和薄雾保留，水域边缘融入暗场；浸入部分为连续器物的变暗段。 |
| [1920x1080/03-temperature-handoff.jpg](1920x1080/03-temperature-handoff.jpg) | 已审 / 通过 | 冷态轮廓进入近景，水域没有硬斜边，标题、说明及控制保持完整。 |
| [1920x1080/04-edge-enter.jpg](1920x1080/04-edge-enter.jpg) | 已审 / 通过 | 微表面近景中的长轴与主棱线连续，文字位于暗区，没有被高光遮住；取景裁切部分右端属于材料特写；可见金属仍连续，终章恢复全览。 |
| [1920x1080/04-edge-hold.jpg](1920x1080/04-edge-hold.jpg) | 已审 / 通过 | 材料分区和反射可读；说明文字与固定导航没有碰撞；取景裁切部分右端属于材料特写；可见金属仍连续，终章恢复全览。 |
| [1920x1080/04-edge-handoff.jpg](1920x1080/04-edge-handoff.jpg) | 已审 / 通过 | 反射收束时器物仍连续可见，没有灰白占位或空白；与终章全览样本相容；取景裁切部分右端属于材料特写；可见金属仍连续，终章恢复全览。 |
| [1920x1080/05-relic-enter.jpg](1920x1080/05-relic-enter.jpg) | 已审 / 通过 | 终章拉回完整器物，标题、结语和重看入口保有空间。 |
| [1920x1080/05-relic-hold.jpg](1920x1080/05-relic-hold.jpg) | 已审 / 通过 | 完整冷态轮廓稳定可见，结语与 Experience again 入口清楚。 |
| [1920x1080/05-relic-handoff.jpg](1920x1080/05-relic-handoff.jpg) | 已审 / 通过 | 终点保持完整冷态画面和重看入口，固定导航仍可辨，没有空帧。 |
| [3840x2160/00-before-form-enter.jpg](3840x2160/00-before-form-enter.jpg) | 已审 / 通过 | 首屏铭文与冷坯完整，正文、向下邀请及固定导航没有互相遮挡。 |
| [3840x2160/00-before-form-hold.jpg](3840x2160/00-before-form-hold.jpg) | 已审 / 通过 | 冷坯稳定停留，标题与页脚留白完整；没有空白或占位画面。 |
| [3840x2160/00-before-form-handoff.jpg](3840x2160/00-before-form-handoff.jpg) | 已审 / 通过 | 标题渐淡，坯体旋转并开始转热，器物持续可见；与炉火进入样本相容。 |
| [3840x2160/01-furnace-enter.jpg](3840x2160/01-furnace-enter.jpg) | 已审 / 通过 | 炉炭与局部热区建立，器物持续可见，标题及说明文字完整。 |
| [3840x2160/01-furnace-hold.jpg](3840x2160/01-furnace-hold.jpg) | 已审 / 通过 | 热核心与氧化斑可辨，炉区没有遮挡标题、正文或底部控制。 |
| [3840x2160/01-furnace-handoff.jpg](3840x2160/01-furnace-handoff.jpg) | 已审 / 通过 | 器物转向力量场景，热轮廓可辨，锤影进入背景时没有空白或额外断片。 |
| [3840x2160/02-strike-enter.jpg](3840x2160/02-strike-enter.jpg) | 已审 / 通过 | 热坯与砧面可辨，锤击进入取景未遮挡文字和固定控制。 |
| [3840x2160/02-strike-hold.jpg](3840x2160/02-strike-hold.jpg) | 已审 / 通过 | 锤坯接触及少量火星可读，说明文字与控制保持清楚，修复没有改变接触观感。 |
| [3840x2160/02-strike-handoff.jpg](3840x2160/02-strike-handoff.jpg) | 已审 / 通过 | 暗尾端与热主体连续，砧面保持在其下方；原穿砧造成的分离片不再出现。 |
| [3840x2160/03-temperature-enter.jpg](3840x2160/03-temperature-enter.jpg) | 已审 / 通过 | 余热器物连续进入局部水线，退出砧体没有切断主体；两行标题完整。 |
| [3840x2160/03-temperature-hold.jpg](3840x2160/03-temperature-hold.jpg) | 已审 / 通过 | 局部水光和薄雾保留，水域边缘融入暗场；浸入部分为连续器物的变暗段。 |
| [3840x2160/03-temperature-handoff.jpg](3840x2160/03-temperature-handoff.jpg) | 已审 / 通过 | 冷态轮廓进入近景，水域没有硬斜边，标题、说明及控制保持完整。 |
| [3840x2160/04-edge-enter.jpg](3840x2160/04-edge-enter.jpg) | 已审 / 通过 | 微表面近景中的长轴与主棱线连续，文字位于暗区，没有被高光遮住；取景裁切部分右端属于材料特写；可见金属仍连续，终章恢复全览。 |
| [3840x2160/04-edge-hold.jpg](3840x2160/04-edge-hold.jpg) | 已审 / 通过 | 材料分区和反射可读；说明文字与固定导航没有碰撞；取景裁切部分右端属于材料特写；可见金属仍连续，终章恢复全览。 |
| [3840x2160/04-edge-handoff.jpg](3840x2160/04-edge-handoff.jpg) | 已审 / 通过 | 反射收束时器物仍连续可见，没有灰白占位或空白；与终章全览样本相容；取景裁切部分右端属于材料特写；可见金属仍连续，终章恢复全览。 |
| [3840x2160/05-relic-enter.jpg](3840x2160/05-relic-enter.jpg) | 已审 / 通过 | 终章拉回完整器物，标题、结语和重看入口保有空间。 |
| [3840x2160/05-relic-hold.jpg](3840x2160/05-relic-hold.jpg) | 已审 / 通过 | 完整冷态轮廓稳定可见，结语与 Experience again 入口清楚。 |
| [3840x2160/05-relic-handoff.jpg](3840x2160/05-relic-handoff.jpg) | 已审 / 通过 | 终点保持完整冷态画面和重看入口，固定导航仍可辨，没有空帧。 |
