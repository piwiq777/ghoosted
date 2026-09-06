'use strict';
/* feed/user está muerto en la web: devuelve la página en vez de datos. Las
 * publicaciones salen ahora de web_profile_info, que las trae incrustadas. */
const { leer, funciones, montar } = require('./lib/extraer');
const { suite } = require('./lib/probar');

module.exports = () => {
  const s = suite('publicaciones · lectura y vías de respaldo');
  const codigo = funciones(leer('ig-api.js'), ['Ewpm', 'Ewp', 'Emap', 'E']);

  const th = () => [{ src: 'th150.jpg', config_width: 150 }, { src: 'th640.jpg', config_width: 640 }, { src: 'th1080.jpg', config_width: 1080 }];
  const PERFIL = { data: { user: { edge_owner_to_timeline_media: { edges: [
    { node: { id: '1', shortcode: 'Ca', display_url: 'full1.jpg', thumbnail_resources: th(), is_video: false,
      edge_liked_by: { count: 120 }, edge_media_to_comment: { count: 7 }, taken_at_timestamp: 1700000000 } },
    { node: { id: '2', shortcode: 'Cb', display_url: 'full2.jpg', thumbnail_resources: th(), is_video: true, video_url: 'v2.mp4',
      edge_media_preview_like: { count: 88 }, edge_media_to_comment: { count: 2 }, taken_at_timestamp: 1700000100 } },
    { node: { id: '3', shortcode: 'Cc', display_url: 'full3.jpg', thumbnail_resources: th(), is_video: false,
      like_and_view_counts_disabled: true, edge_media_to_comment: { count: 0 }, taken_at_timestamp: 1700000200,
      edge_sidecar_to_children: { edges: [
        { node: { display_url: 'c1.jpg', is_video: false, thumbnail_resources: th() } },
        { node: { display_url: 'c2.jpg', is_video: true, video_url: 'c2.mp4', thumbnail_resources: th() } }] } } },
  ] } } } };
  const FEED = (n) => ({ items: Array.from({ length: n }, (_, i) => ({ id: 'p' + i + '_9', code: 'k' + i,
    image_versions2: { candidates: [{ url: 'a' + i + '.jpg', width: 640 }] }, like_count: 5, comment_count: 1, taken_at: 1700000000 })),
    more_available: true, next_max_id: 'CURSOR' });

  const montarCon = (rutas) => {
    const pedidas = [];
    const pedir = async (u) => {
      pedidas.push(u);
      const clave = Object.keys(rutas).find((k) => u.includes(k));
      const r = rutas[clave];
      if (r === undefined || r === '404') { const e = new Error('http'); e.kind = 'http'; e.status = 404; throw e; }
      return r;
    };
    const api = montar(codigo, { J: pedir, X: pedir, g: (o) => (o && o[0] && o[0].url) || '' }, '{Ewp,E}');
    return { api, pedidas };
  };

  return (async () => {
    { const { api } = montarCon({ web_profile_info: PERFIL });
      const r = await api.Ewp('@lau');
      s.eq('lee las tres publicaciones', r.posts.length, 3);
      s.eq('coge la miniatura de 640', r.posts[0].thumb, 'th640.jpg');
      s.eq('los me gusta', r.posts[0].likes, 120);
      s.eq('la fecha en milisegundos', r.posts[0].ts, 1700000000000);
      s.eq('detecta el vídeo', [r.posts[1].isVideo, r.posts[1].video], [true, 'v2.mp4']);
      s.eq('me gusta por la otra vía', r.posts[1].likes, 88);
      s.eq('carrusel de dos piezas', [r.posts[2].multi, r.posts[2].slides], [true, 2]);
      s.eq('la segunda del carrusel es vídeo', r.posts[2].media[1].video, 'c2.mp4');
      s.eq('me gusta ocultos', r.posts[2].likesHidden, true); }

    { const { api, pedidas } = montarCon({ web_profile_info: PERFIL });
      const r = await api.E('123', 12, null, 'lau');
      s.eq('la cascada las recupera', r.posts.length, 3);
      s.eq('con una sola petición', pedidas.length, 1); }

    { const { api } = montarCon({ web_profile_info: '404', 'feed/user': FEED(12) });
      const r = await api.E('123', 12, null, 'lau');
      s.eq('si falla, tira de feed/user', r.posts.length, 12);
      s.eq('y conserva el cursor', r.next, 'CURSOR'); }

    { const { api, pedidas } = montarCon({ 'feed/user': FEED(12) });
      await api.E('123', 12, 'CURSOR', 'lau');
      s.eq('al paginar no usa web_profile_info', pedidas.some((u) => u.includes('web_profile_info')), false); }

    { const { api } = montarCon({ web_profile_info: { data: { user: {} } } });
      const r = await api.E('123', 12, null, 'lau');
      s.eq('cuenta privada sin acceso: cero y con motivo', [r.posts.length, !!r.err], [0, true]); }
    return s;
  })();
};
