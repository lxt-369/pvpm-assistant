/**
 * 云函数：报告生成
 * 支持多种类型报告的生成与管理
 */
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { action, type, formData, reportId } = event;
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  switch (action) {
    case 'generate':
      return await generateReport(type, formData, openid);
    case 'getList':
      return await getReportList(openid);
    case 'getDetail':
      return await getReportDetail(reportId, openid);
    case 'delete':
      return await deleteReport(reportId, openid);
    default:
      return { error: '未知操作' };
  }
};

/**
 * 生成报告
 */
async function generateReport(type, formData, openid) {
  // 根据类型生成不同的报告内容
  const report = buildReport(type, formData);

  // 保存到数据库
  try {
    const result = await db.collection('reports').add({
      data: {
        ...report,
        openid: openid,
        createdAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    });
    report._id = result._id;
  } catch (e) {
    console.warn('数据库保存失败（可能未创建集合）:', e);
    report._id = 'local_' + Date.now();
  }

  return {
    success: true,
    report: report
  };
}

/**
 * 获取报告列表
 */
async function getReportList(openid) {
  try {
    const result = await db.collection('reports')
      .where({ openid: openid })
      .orderBy('createdAt', 'desc')
      .limit(30)
      .get();

    return {
      success: true,
      reports: result.data
    };
  } catch (e) {
    return {
      success: false,
      error: e.message,
      reports: []
    };
  }
}

/**
 * 获取报告详情
 */
async function getReportDetail(reportId, openid) {
  try {
    const result = await db.collection('reports')
      .doc(reportId)
      .get();

    return {
      success: true,
      report: result.data
    };
  } catch (e) {
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * 删除报告
 */
async function deleteReport(reportId, openid) {
  try {
    await db.collection('reports')
      .doc(reportId)
      .remove();

    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * 构建报告内容
 */
function buildReport(type, data) {
  const base = {
    title: '',
    projectName: data.projectName || '未命名项目',
    productType: data.productType || '光伏组件',
    targetMarket: data.targetMarket || '国内市场',
    timeline: data.timeline || '12个月',
    sections: []
  };

  switch (type) {
    case 'demand':
      return buildDemandReport(base, data);
    case 'marketing':
      return buildMarketingReport(base, data);
    case 'full':
    default:
      return buildFullReport(base, data);
  }
}

function buildDemandReport(base, data) {
  return {
    ...base,
    title: `${base.projectName}市场需求分析报告`,
    sections: [
      {
        title: '一、宏观环境分析（PESTEL）',
        content: `## 政策环境\n双碳目标持续推进，光伏政策支持力度加大。\n\n## 经济环境\n组件价格下降，光伏项目IRR提升。\n\n## 技术环境\nTOPCon技术成熟，HJT成本持续下降。`
      },
      {
        title: '二、市场规模测算',
        content: `## TAM/SAM/SOM分析\nTAM（整体市场）：全球5000亿元\nSAM（可服务市场）：目标区域800亿元\nSOM（可获得市场）：目标份额5-8%=40-64亿元`
      },
      {
        title: '三、客户需求分析',
        content: `## 核心诉求\n1. 度电成本降低（权重40%）\n2. 产品可靠性（25%）\n3. 运维便捷性（20%）\n4. 交付及时性（15%）`
      }
    ]
  };
}

function buildMarketingReport(base, data) {
  return {
    ...base,
    title: `${base.projectName}上市营销策略报告`,
    sections: [
      {
        title: '一、市场定位',
        content: `## 目标客户\n${data.targetMarket || '工商业客户'}为主\n\n## 差异化定位\n高效+高可靠+低衰减`
      },
      {
        title: '二、4P营销组合',
        content: `## 产品策略\n核心产品：${data.productType}\n\n## 价格策略\n基础定价0.90元/W\n\n## 渠道策略\n头部EPC（60%）+代理商（30%）+直客（10%）\n\n## 促销策略\n标杆项目+技术白皮书+行业峰会`
      },
      {
        title: '三、上市计划',
        content: `## 阶段一（1-3月）\n产品发布+标杆签约\n\n## 阶段二（4-6月）\n案例包装+渠道拓展\n\n## 阶段三（7-12月）\n规模化复制+品牌建设`
      }
    ]
  };
}

function buildFullReport(base, data) {
  return {
    ...base,
    title: `${base.projectName}产品全生命周期报告`,
    sections: [
      {
        title: '一、市场分析',
        content: `## 1.1 市场背景\n${base.targetMarket}光伏市场持续增长，分布式占比提升至60%。\n\n## 1.2 竞争格局\n头部企业占据55%市场份额，差异化竞争为核心。`
      },
      {
        title: '二、产品规划',
        content: `## 2.1 产品定义\n${base.productType}，定位中高端市场。\n\n## 2.2 技术路线\nTOPCon技术，量产效率目标26.5%。`
      },
      {
        title: '三、上市策略',
        content: `## 3.1 定价\n基础定价0.90元/W，战略客户5%折扣。\n\n## 3.2 渠道\nEPC战略合作（60%）+区域代理（30%）+直客（10%）。`
      },
      {
        title: '四、财务预测',
        content: `## 营收\n第一年出货500MW，营收4.5亿元。\n\n## 盈利\n目标毛利率25%，净利率8-10%。\n\n## 回收期\n约2.5年。`
      },
      {
        title: '五、风险评估',
        content: `## 市场风险\n产能过剩导致价格战\n\n## 技术风险\n新技术路线替代\n\n## 应对\n差异化产品策略+多元化供应链`
      },
      {
        title: '六、行动计划',
        content: `## 近期（0-3月）\n产品设计定型+供应链备货\n\n## 中期（3-9月）\n产品上市+标杆项目交付\n\n## 远期（9-12月）\n规模化复制+产品迭代`
      }
    ]
  };
}
