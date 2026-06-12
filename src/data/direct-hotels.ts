export type StarRating = 1 | 2 | 3 | 4 | 5;
export type DirectCategory = '直采' | 'prebuy' | '独家合作';

export type DirectHotel = {
  hotel_id:     string;
  hotel_name:   string;
  country:      string;
  city:         string;
  address:      string;
  star_rating:  StarRating;
  /** 直采 — 与酒店直接签约采购 */
  is_direct:    boolean;
  /** Prebuy — 预付买断库存 */
  is_prebuy:    boolean;
  /** 独家合作 — 排他性合作协议 */
  is_exclusive: boolean;
};

export const DIRECT_HOTELS: DirectHotel[] = [
  { hotel_id: 'D0001', hotel_name: 'Grand Hyatt Bangkok',          country: '泰国',       city: '曼谷',   address: '494 Rajdamri Road, Pathumwan',                       star_rating: 5, is_direct: true,  is_prebuy: false, is_exclusive: false },
  { hotel_id: 'D0002', hotel_name: 'Sheraton Grande Tokyo Bay',    country: '日本',       city: '东京',   address: '1-9 Maihama, Urayasu, Chiba',                        star_rating: 4, is_direct: false, is_prebuy: true,  is_exclusive: false },
  { hotel_id: 'D0003', hotel_name: 'Jumeirah Burj Al Arab',        country: '阿联酋',     city: '迪拜',   address: 'Jumeirah Road, Umm Suqeim 3',                        star_rating: 5, is_direct: false, is_prebuy: false, is_exclusive: true  },
  { hotel_id: 'D0004', hotel_name: 'Capella Singapore',            country: '新加坡',     city: '新加坡', address: '1 The Knolls, Sentosa Island',                       star_rating: 5, is_direct: true,  is_prebuy: false, is_exclusive: true  },
  { hotel_id: 'D0005', hotel_name: 'Westin Resort Nusa Dua Bali',  country: '印度尼西亚', city: '巴厘岛', address: 'Kawasan Pariwisata BTDC, Nusa Dua',                  star_rating: 4, is_direct: false, is_prebuy: true,  is_exclusive: false },
  { hotel_id: 'D0006', hotel_name: 'Shangri-La Kuala Lumpur',      country: '马来西亚',   city: '吉隆坡', address: '11 Jalan Sultan Ismail, Kuala Lumpur',               star_rating: 5, is_direct: true,  is_prebuy: true,  is_exclusive: false },
  { hotel_id: 'D0007', hotel_name: 'W Seoul Walkerhill',           country: '韩国',       city: '首尔',   address: '21 Gwangnaru-ro 145-gil, Gwangjin-gu',              star_rating: 5, is_direct: false, is_prebuy: false, is_exclusive: true  },
  { hotel_id: 'D0008', hotel_name: 'The Star Grand Gold Coast',    country: '澳大利亚',   city: '黄金海岸', address: '1 Casino Dr, Broadbeach QLD 4218',                star_rating: 4, is_direct: false, is_prebuy: true,  is_exclusive: false },
  { hotel_id: 'D0009', hotel_name: 'Sofitel Paris Le Faubourg',    country: '法国',       city: '巴黎',   address: '15 Rue Boissy d\'Anglas, 8e arrondissement',        star_rating: 5, is_direct: true,  is_prebuy: false, is_exclusive: false },
  { hotel_id: 'D0010', hotel_name: 'Waldorf Astoria Amsterdam',    country: '荷兰',       city: '阿姆斯特丹', address: 'Herengracht 542-556, Amsterdam',                star_rating: 5, is_direct: false, is_prebuy: false, is_exclusive: true  },
];
