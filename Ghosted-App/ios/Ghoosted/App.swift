import UIKit
import WebKit
import UserNotifications

/*
 Ghoosted en el iPhone. Lo mismo que MainActivity.java en Android:

 - ig: instagram.com de verdad, donde inicias sesion en la pagina oficial y
   donde corren page-api.js e ig-api.js de la extension, mas puente-ig.js.
 - ui: el diseño, servido desde el paquete de la app por el esquema ghd://.

 Esta clase pasa mensajes entre las dos y hace lo que una web no puede:
 abrir Instagram, avisar con una notificacion y traer las fotos (ghdfoto://).
*/

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    func application(_ app: UIApplication, didFinishLaunchingWithOptions o: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        window = UIWindow(frame: UIScreen.main.bounds)
        window?.rootViewController = Principal()
        window?.makeKeyAndVisible()
        return true
    }
}

final class Principal: UIViewController, WKScriptMessageHandler, WKNavigationDelegate {
    private var ui: WKWebView!
    private var ig: WKWebView!
    private let capa = UIView()
    private let titulo = UILabel()
    private var conectado = false
    private var paraEntrar = false
    private var oscuro = false
    private let IG = URL(string: "https://www.instagram.com/")!

    override var preferredStatusBarStyle: UIStatusBarStyle { oscuro ? .lightContent : .darkContent }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.965, green: 0.961, blue: 0.973, alpha: 1)

        // --- vista de Instagram, con los tres scripts inyectados en cada carga
        let cIg = WKWebViewConfiguration()
        cIg.websiteDataStore = .default()
        let codigo = "window.__ghdAppId=window.__ghdAppId||'1217981644879628';\nif(!window.__ghdCargado){window.__ghdCargado=1;\n" + leer("ig/page-api.js") + "\n" + leer("ig/ig-api.js") + "\n}\n" + leer("ig/puente-ig.js")
        cIg.userContentController.addUserScript(WKUserScript(source: codigo, injectionTime: .atDocumentEnd, forMainFrameOnly: true))
        cIg.userContentController.add(self, name: "ghdig")
        ig = WKWebView(frame: .zero, configuration: cIg)
        ig.navigationDelegate = self
        ig.customUserAgent = nil

        // --- vista del diseño
        let cUi = WKWebViewConfiguration()
        cUi.setURLSchemeHandler(Recursos(), forURLScheme: "ghd")
        cUi.setURLSchemeHandler(Fotos(), forURLScheme: "ghdfoto")
        cUi.allowsInlineMediaPlayback = true
        cUi.mediaTypesRequiringUserActionForPlayback = []
        cUi.userContentController.add(self, name: "ghd")
        ui = WKWebView(frame: .zero, configuration: cUi)
        ui.isOpaque = false
        ui.backgroundColor = .clear
        ui.scrollView.contentInsetAdjustmentBehavior = .never
        ui.navigationDelegate = self

        // --- la capa de Instagram, con una barra para cerrarla
        capa.backgroundColor = .white
        let barra = UIStackView()
        barra.axis = .horizontal
        barra.alignment = .center
        barra.isLayoutMarginsRelativeArrangement = true
        barra.layoutMargins = UIEdgeInsets(top: 8, left: 16, bottom: 8, right: 8)
        titulo.font = .systemFont(ofSize: 14)
        titulo.textColor = UIColor(red: 0.39, green: 0.39, blue: 0.42, alpha: 1)
        let listo = UIButton(type: .system)
        listo.setTitle("Listo", for: .normal)
        listo.titleLabel?.font = .boldSystemFont(ofSize: 16)
        listo.tintColor = UIColor(red: 0.84, green: 0.16, blue: 0.46, alpha: 1)
        listo.addTarget(self, action: #selector(ocultarIg), for: .touchUpInside)
        barra.addArrangedSubview(titulo)
        barra.addArrangedSubview(listo)
        let pila = UIStackView(arrangedSubviews: [barra, ig])
        pila.axis = .vertical
        capa.addSubview(pila)
        pila.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            pila.topAnchor.constraint(equalTo: capa.safeAreaLayoutGuide.topAnchor),
            pila.bottomAnchor.constraint(equalTo: capa.bottomAnchor),
            pila.leadingAnchor.constraint(equalTo: capa.leadingAnchor),
            pila.trailingAnchor.constraint(equalTo: capa.trailingAnchor)
        ])

        for v in [capa, ui!] as [UIView] {
            view.addSubview(v)
            v.translatesAutoresizingMaskIntoConstraints = false
            NSLayoutConstraint.activate([
                v.topAnchor.constraint(equalTo: view.topAnchor), v.bottomAnchor.constraint(equalTo: view.bottomAnchor),
                v.leadingAnchor.constraint(equalTo: view.leadingAnchor), v.trailingAnchor.constraint(equalTo: view.trailingAnchor)
            ])
        }
        capa.isHidden = true   // trabaja detras hasta que haga falta

        ig.load(URLRequest(url: IG))
        ui.load(URLRequest(url: URL(string: "ghd://app/web/index.html")!))
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in }
        NotificationCenter.default.addObserver(forName: UIApplication.willEnterForegroundNotification, object: nil, queue: .main) { [weak self] _ in
            self?.aUi(["tipo": "volver"])
        }
    }

    // MARK: mensajes

    func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
        guard let s = m.body as? String else { return }
        if m.name == "ghdig" {
            // De la vista de Instagram: se reenvia tal cual al diseño.
            if let d = try? JSONSerialization.jsonObject(with: Data(s.utf8)) as? [String: Any], d["tipo"] as? String == "sesion" {
                let antes = conectado
                conectado = d["conectado"] as? Bool ?? false
                if conectado && !antes && paraEntrar { ocultarIg() }
            }
            aUiTexto(s)
            return
        }
        guard m.name == "ghd", let d = try? JSONSerialization.jsonObject(with: Data(s.utf8)) as? [String: Any] else { return }
        let id = d["id"] as? String ?? ""
        if d["tipo"] as? String == "llamar" {
            let falla = json(["tipo": "resultado", "id": id, "ok": false, "error": ["kind": "transport", "message": "ig_no_listo"]])
            ig.evaluateJavaScript("window.GhdIGRecibir ? GhdIGRecibir(\(citar(s))) : window.webkit.messageHandlers.ghdig.postMessage(\(citar(falla)))")
            return
        }
        let datos = d["datos"] as? [String: Any] ?? [:]
        switch d["orden"] as? String ?? "" {
        case "mostrarInstagram": paraEntrar = !conectado; mostrarIg()
        case "abrir": if let u = URL(string: datos["url"] as? String ?? ""), u.scheme == "https" { UIApplication.shared.open(u) }
        case "notificar": avisar(datos["titulo"] as? String ?? "", datos["texto"] as? String ?? "")
        case "tema": oscuro = datos["oscuro"] as? Bool ?? false; setNeedsStatusBarAppearanceUpdate()
        case "cerrarSesion":
            // Solo lo de Instagram/Facebook: lo del diseño (tu historial y tu
            // clave Pro) vive en el mismo almacen y no se toca.
            let almacen = WKWebsiteDataStore.default(), tipos = WKWebsiteDataStore.allWebsiteDataTypes()
            almacen.fetchDataRecords(ofTypes: tipos) { [weak self] rs in
                let suyos = rs.filter { $0.displayName.contains("instagram") || $0.displayName.contains("facebook") }
                almacen.removeData(ofTypes: tipos, for: suyos) {
                    guard let self = self else { return }
                    self.conectado = false
                    self.ig.load(URLRequest(url: self.IG))
                    self.aUi(["tipo": "sesion", "conectado": false])
                }
            }
        default: break
        }
        aUi(["tipo": "resultado", "id": id, "ok": true, "valor": NSNull()])
    }

    private func aUi(_ o: [String: Any]) { aUiTexto(json(o)) }
    private func aUiTexto(_ s: String) { ui.evaluateJavaScript("window.Puente && Puente.recibir(\(citar(s)))") }
    private func json(_ o: Any) -> String { (try? String(data: JSONSerialization.data(withJSONObject: o), encoding: .utf8)) ?? "{}" }
    private func citar(_ s: String) -> String { json([s]).dropFirst().dropLast().description }

    // MARK: navegacion

    func webView(_ w: WKWebView, decidePolicyFor a: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let u = a.request.url else { return decisionHandler(.cancel) }
        if w === ui {
            if u.scheme == "ghd" { return decisionHandler(.allow) }
            if u.scheme == "https" { UIApplication.shared.open(u) }
            return decisionHandler(.cancel)
        }
        let h = u.host ?? ""
        if u.scheme == "about" || h.hasSuffix("instagram.com") || h.hasSuffix("facebook.com") || h.hasSuffix("fbcdn.net") { return decisionHandler(.allow) }
        if u.scheme == "https" { UIApplication.shared.open(u) }
        decisionHandler(.cancel)
    }

    func webView(_ w: WKWebView, didFinish n: WKNavigation!) {
        // El lienzo mide 58 px desde arriba del todo; la zona segura del
        // iPhone ya pone ~47, asi que aqui solo falta el resto.
        if w === ui { ui.evaluateJavaScript("document.documentElement.style.setProperty('--arriba','11px')") }
        if w === ui && conectado { aUi(["tipo": "sesion", "conectado": true]) }
    }

    private func mostrarIg() {
        titulo.text = conectado ? "Instagram" : "Inicia sesión · tu contraseña va solo a Instagram"
        capa.isHidden = false
        view.bringSubviewToFront(capa)
    }

    @objc private func ocultarIg() {
        paraEntrar = false
        view.bringSubviewToFront(ui)
        capa.isHidden = true
    }

    private func avisar(_ t: String, _ x: String) {
        let c = UNMutableNotificationContent()
        c.title = t; c.body = x
        UNUserNotificationCenter.current().add(UNNotificationRequest(identifier: UUID().uuidString, content: c, trigger: nil))
    }

    private func leer(_ ruta: String) -> String {
        guard let u = Bundle.main.url(forResource: "Recursos/" + ruta, withExtension: nil) else { return "" }
        return (try? String(contentsOf: u, encoding: .utf8)) ?? ""
    }
}

/// ghd://app/web/... desde el paquete de la app. Solo /web.
final class Recursos: NSObject, WKURLSchemeHandler {
    private let tipos = ["html": "text/html", "js": "application/javascript", "css": "text/css", "woff2": "font/woff2", "png": "image/png", "svg": "image/svg+xml"]
    func webView(_ w: WKWebView, start t: WKURLSchemeTask) {
        guard let u = t.request.url, u.path.hasPrefix("/web/"), !u.path.contains(".."),
              let f = Bundle.main.url(forResource: "Recursos" + u.path, withExtension: nil), let d = try? Data(contentsOf: f) else {
            t.didFailWithError(URLError(.fileDoesNotExist)); return
        }
        let tipo = tipos[u.pathExtension] ?? "application/octet-stream"
        t.didReceive(HTTPURLResponse(url: u, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": tipo])!)
        t.didReceive(d)
        t.didFinish()
    }
    func webView(_ w: WKWebView, stop t: WKURLSchemeTask) {}
}

/// ghdfoto://f?u=<url>: las fotos y videos de Instagram, pedidos desde el
/// telefono. Solo sus CDN.
final class Fotos: NSObject, WKURLSchemeHandler {
    private var vivas = Set<ObjectIdentifier>()
    func webView(_ w: WKWebView, start t: WKURLSchemeTask) {
        guard let u = t.request.url, let q = URLComponents(url: u, resolvingAgainstBaseURL: false)?.queryItems?.first(where: { $0.name == "u" })?.value,
              let destino = URL(string: q), destino.scheme == "https",
              let h = destino.host, h.hasSuffix(".cdninstagram.com") || h.hasSuffix(".fbcdn.net") else {
            t.didFailWithError(URLError(.badURL)); return
        }
        let id = ObjectIdentifier(t as AnyObject)
        vivas.insert(id)
        var r = URLRequest(url: destino)
        r.setValue("https://www.instagram.com/", forHTTPHeaderField: "Referer")
        URLSession.shared.dataTask(with: r) { [weak self] d, resp, e in
            DispatchQueue.main.async {
                guard let self = self, self.vivas.contains(id) else { return }
                self.vivas.remove(id)
                guard let d = d, let hr = resp as? HTTPURLResponse else { t.didFailWithError(e ?? URLError(.badServerResponse)); return }
                t.didReceive(HTTPURLResponse(url: u, statusCode: hr.statusCode, httpVersion: nil,
                                             headerFields: ["Content-Type": hr.value(forHTTPHeaderField: "Content-Type") ?? "image/jpeg", "Cache-Control": "max-age=86400"])!)
                t.didReceive(d)
                t.didFinish()
            }
        }.resume()
    }
    func webView(_ w: WKWebView, stop t: WKURLSchemeTask) { vivas.remove(ObjectIdentifier(t as AnyObject)) }
}
