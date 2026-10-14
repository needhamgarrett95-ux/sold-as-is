import UIKit
import WebKit
import UniformTypeIdentifiers

/// Sold As-Is — personal native edition.
///
/// The whole game (HTML/CSS/JS + all art/audio) is bundled in the app's
/// Game/ folder and loaded from the app bundle — fully offline.
/// Saves are NOT left to Safari-style web storage: the JS bridge mirrors
/// every save to a real JSON file in the app's Documents folder
/// (soldasis_save_v1.json, plus one rotating .backup). That file lives in
/// the app's native sandbox, survives updates, and is visible in the
/// Files app (UIFileSharingEnabled) so Garrett can copy it out himself.
/// On launch the file is seeded back into localStorage before the
/// game's own load code runs.
final class ViewController: UIViewController, WKScriptMessageHandler, UIDocumentPickerDelegate {

    private var webView: WKWebView!

    private var documentsURL: URL {
        FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
    }
    private var saveURL: URL { documentsURL.appendingPathComponent("soldasis_save_v1.json") }
    private var backupURL: URL { documentsURL.appendingPathComponent("soldasis_save_v1.backup.json") }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black

        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        // Seed localStorage from the native save file before any game JS runs.
        if let seed = seedScript() {
            config.userContentController.addUserScript(
                WKUserScript(source: seed, injectionTime: .atDocumentStart, forMainFrameOnly: true)
            )
        }
        config.userContentController.add(self, name: "saveSync")

        webView = WKWebView(frame: .zero, configuration: config)
        webView.scrollView.bounces = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.backgroundColor = .black
        webView.isOpaque = false
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
        ])

        guard let gameURL = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "Game") else {
            assertionFailure("Game/index.html missing from app bundle")
            return
        }
        let gameFolder = gameURL.deletingLastPathComponent()
        webView.loadFileURL(gameURL, allowingReadAccessTo: gameFolder)
    }

    // MARK: - Native save file

    private func seedScript() -> String? {
        guard let data = try? Data(contentsOf: saveURL),
              let saveString = String(data: data, encoding: .utf8),
              !saveString.isEmpty else { return nil }
        // Encode the save as a JSON string literal safe to embed in JS.
        guard let literalData = try? JSONSerialization.data(withJSONObject: [saveString]),
              let literalArray = String(data: literalData, encoding: .utf8) else { return nil }
        let literal = String(literalArray.dropFirst().dropLast()) // strip [ ]
        return "(function(){try{localStorage.setItem('soldasis_save_v1', \(literal));}catch(e){}})();"
    }

    private func writeSave(_ value: String) {
        guard let data = value.data(using: .utf8) else { return }
        // Rotate one backup, then write atomically.
        if FileManager.default.fileExists(atPath: saveURL.path) {
            try? FileManager.default.removeItem(at: backupURL)
            try? FileManager.default.copyItem(at: saveURL, to: backupURL)
        }
        try? data.write(to: saveURL, options: .atomic)
    }

    private func clearSave() {
        try? FileManager.default.removeItem(at: saveURL)
        try? FileManager.default.removeItem(at: backupURL)
    }

    // MARK: - JS bridge

    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        guard message.name == "saveSync",
              let body = message.body as? [String: Any],
              let action = body["action"] as? String else { return }

        switch action {
        case "save":
            if let value = body["value"] as? String { writeSave(value) }
        case "clear":
            clearSave()
        case "export":
            exportSave(currentValue: body["value"] as? String)
        case "import":
            importSave()
        default:
            break
        }
    }

    private func exportSave(currentValue: String?) {
        if let value = currentValue, !value.isEmpty { writeSave(value) }
        guard FileManager.default.fileExists(atPath: saveURL.path) else { return }
        let sheet = UIActivityViewController(activityItems: [saveURL], applicationActivities: nil)
        sheet.popoverPresentationController?.sourceView = view
        sheet.popoverPresentationController?.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 0, height: 0)
        present(sheet, animated: true)
    }

    private func importSave() {
        let picker = UIDocumentPickerViewController(forOpeningContentTypes: [UTType.json, UTType.data, UTType.plainText])
        picker.delegate = self
        picker.allowsMultipleSelection = false
        present(picker, animated: true)
    }

    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        guard let url = urls.first else { return }
        let scoped = url.startAccessingSecurityScopedResource()
        defer { if scoped { url.stopAccessingSecurityScopedResource() } }
        guard let data = try? Data(contentsOf: url),
              let text = String(data: data, encoding: .utf8),
              let parsed = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              parsed["v"] as? Int == 1, parsed["garage"] != nil else { return }
        writeSave(text)
        // Push the restored save into the page and restart the game on it.
        if let literalData = try? JSONSerialization.data(withJSONObject: [text]),
           let literalArray = String(data: literalData, encoding: .utf8) {
            let literal = String(literalArray.dropFirst().dropLast())
            webView.evaluateJavaScript("try{localStorage.setItem('soldasis_save_v1', \(literal));}catch(e){} location.reload();")
        }
    }
}
