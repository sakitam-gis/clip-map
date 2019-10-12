import { Service } from 'egg';
import axios from 'axios';
import { getDomain } from '../utils/common';

class MaskData extends Service {
  /**
   * 获取遮罩层数据
   */
  public async getData() {
    const baseUrl = getDomain(this);
    const data = await axios.get('/public/data/beijing.json', {
      baseURL: baseUrl,
    }).then(res => res.data);
    this.logger.info('success：获取 json 数据成功。');
    return data;
  }

  /**
   * 获取 mapbox 样式 json 数据
   * @param path
   * @param isLocal
   */
  public async getStyleJson(path: string, isLocal?: boolean) {
    const baseUrl = getDomain(this);
    const data = await axios.get(path, {
      baseURL: isLocal ? baseUrl : '',
    }).then(res => res.data);
    this.logger.info('success：获取 stylejson 数据成功。');
    return data;
  }
}

export default MaskData;
