# Scientific references / 工艺参考

这些官方资料用于理解材料、工艺与结构之间的关系。网站的几何和动效为独立创作；未将这些来源的图片、显微图、厂商标识或原始图纸作为资源打包。

## 资料与应用范围

| 来源 | 用于校准的概念 |
| --- | --- |
| [SUMCO — Manufacturing process](https://www.sumcosi.com/english/products/process/) | 高纯材料、单晶、生长、切片与抛光晶圆之间的材料路径 |
| [ASML — Semiconductor manufacturing process steps](https://www.asml.com/en/company/stories/2021/semiconductor-manufacturing-process-steps) | 沉积、光刻、刻蚀等工序的关系与反复加工 |
| [ASML — EUV lithography systems](https://www.asml.com/en/products/euv-lithography-systems) | EUV 曝光与反射式光学系统 |
| [Lam Research — Deposition](https://www.lamresearch.com/products/our-processes/deposition/) | 薄膜沉积及结构逐层形成 |
| [imec — Entering the nanosheet transistor era](https://www.imec-int.com/en/articles/entering-nanosheet-transistor-era-0) | nanosheet、环栅结构与沟道控制 |
| [IBM Research — Stacked nanosheet gate-all-around transistor to enable scaling beyond FinFET](https://research.ibm.com/publications/stacked-nanosheet-gate-all-around-transistor-to-enable-scaling-beyond-finfet) | 堆叠硅沟道、栅介质和 gate-all-around 的结构关系 |
| [imec — BEOL](https://www.imec-int.com/en/expertise/cmos-advanced/compute/beol) | 多层金属互连、线路与垂直 via |
| [imec — Mitigating the thermal bottleneck of advanced interconnects](https://www.imec-int.com/en/articles/mitigating-thermal-bottleneck-advanced-interconnects) | 活性器件、互连和封装之间的散热关系 |
| [TSMC 3DFabric — CoWoS](https://3dfabric.tsmc.com/english/dedicatedFoundry/technology/cowos.htm) | substrate / interposer / logic dies / HBM 的封装层级 |
| [SK hynix — Partnership with TSMC for HBM](https://news.skhynix.com/en/sk-hynix-partners-with-tsmc-to-strengthen-hbm-technological-leadership/) | HBM 的堆叠内存角色及其与先进封装的关系 |

## 有意进行的视觉化简

**尺度与流程。** 本作品组合多个制造阶段来建立连贯视觉叙事。几何尺寸、层数、间距、工序数量和运行时间均不按真实比例。它不描述某一特定节点、制造商或生产流程，也不是可执行的工艺配方。

**曝光与图形转移。** 光刻曝光改变 photoresist，后续显影与刻蚀把图形转移到下层材料。网站将这些阶段压缩并连续呈现。光束的紫白颜色用来标记原本不可见的 EUV；所画光路是反射式示意，镜面数量与布局不是设备的光学设计图。

**晶体管。** 剖面采用三层 nanosheet 的 gate-all-around 实例，不代表所有晶体管。叙事中选择性移除类似 SiGe 的牺牲层来引出沟道；真实的材料和制造步骤更复杂。栅介质将导电栅与硅沟道隔开。

**互连与封装。** 铜色线路和 via 强调水平互连与垂直连接。封装参考 CoWoS-S 类型的层级关系，采用通用 substrate、硅 interposer、两块逻辑 chiplet 和四组独立 HBM 堆叠，不对应任何具体产品。HBM 的 DRAM 层与晶体管的 nanosheet 沟道是不同尺度、不同用途的结构。

**信号与温度。** 发光点表示线路活动及传播次序，不显示电子的实际漂移速度，也不是逐晶体管电路仿真。热区采用归一化着色，未求解热传导方程、给出结温或声称达到热仿真的物理精度。

**叙事用语。** “From sand to signal”和“awakened”是从材料到计算活动的视觉表达，不宣称芯片具有意识。

## English scope note

The exhibit is a schematic visual synthesis informed by the primary sources above. Dimensions, timing, layer counts and the manufacturing sequence are deliberately compressed. Exposure modifies resist; development and etch transfer the pattern. Violet is a visual representation of invisible EUV radiation, with a simplified reflective path. The GAA device is one example, not a universal transistor model. The generic package separates logic dies, HBM stacks, interposer and substrate. Signal packets represent activity rather than electron drift, and the normalized thermal field is not a solved physical simulation. No vendor imagery or diagrams are distributed, and no endorsement or consciousness claim is implied.
