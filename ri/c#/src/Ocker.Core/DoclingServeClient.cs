// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Jenko <adam@isaidusaid.com>
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Ocker;

/// <summary>Connection settings for a Docling Serve v1 instance.</summary>
public sealed class DoclingServeOptions
{
    public Uri BaseUrl { get; init; } = new("http://localhost:5001/");
    public TimeSpan Timeout { get; init; } = TimeSpan.FromMinutes(2);
}

/// <summary>Small HTTP client for Docling Serve's v1 PDF conversion endpoint.</summary>
public sealed class DoclingServeClient : IDisposable
{
    private readonly HttpClient _httpClient;
    private readonly bool _ownsHttpClient;

    public DoclingServeClient(DoclingServeOptions? options = null) : this(CreateHttpClient(), options, true) { }
    public DoclingServeClient(HttpClient httpClient, DoclingServeOptions? options = null) : this(httpClient, options, false) { }

    private DoclingServeClient(HttpClient httpClient, DoclingServeOptions? options, bool ownsHttpClient)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        Options = options ?? new DoclingServeOptions();
        if (!Options.BaseUrl.IsAbsoluteUri || Options.BaseUrl.Scheme is not ("http" or "https") || string.IsNullOrWhiteSpace(Options.BaseUrl.Host) || !string.IsNullOrEmpty(Options.BaseUrl.UserInfo) || !string.IsNullOrEmpty(Options.BaseUrl.Query) || !string.IsNullOrEmpty(Options.BaseUrl.Fragment) || HasQueryOrFragmentDelimiter(Options.BaseUrl))
            throw new ArgumentException("Docling Serve base URL must be an absolute HTTP(S) URL without credentials, a query, or a fragment.", nameof(options));
        if (Options.Timeout <= TimeSpan.Zero) throw new ArgumentException("Docling Serve timeout must be positive.", nameof(options));
        _ownsHttpClient = ownsHttpClient;
    }

    private static HttpClient CreateHttpClient() => new() { Timeout = System.Threading.Timeout.InfiniteTimeSpan };
    private static bool HasQueryOrFragmentDelimiter(Uri uri) => uri.OriginalString.Contains('?') || uri.OriginalString.Contains('#');

    public DoclingServeOptions Options { get; }

    public async Task TestConnectionAsync(CancellationToken cancellationToken = default)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, Endpoint("health"));
        using var response = await SendAsync(request, cancellationToken).ConfigureAwait(false);
        if (!response.IsSuccessStatusCode) throw CreateResponseException(response, "is not ready");
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            using var health = JsonDocument.Parse(responseBody);
            if (!health.RootElement.TryGetProperty("status", out var status) || status.ValueKind != JsonValueKind.String || status.GetString() != "ok")
                throw new OckerException($"Docling Serve at {Options.BaseUrl} returned an unexpected health response. Expected {{\"status\":\"ok\"}}.");
        }
        catch (JsonException) { throw new OckerException($"Docling Serve at {Options.BaseUrl} returned an invalid health response. Expected {{\"status\":\"ok\"}}."); }
    }

    internal async Task<JsonDocument> ConvertPdfAsync(byte[] bytes, string fileName, CancellationToken cancellationToken)
    {
        using var form = new MultipartFormDataContent();
        form.Add(new StringContent("json", Encoding.UTF8), "to_formats");
        form.Add(new StringContent("true", Encoding.UTF8), "do_ocr");
        form.Add(new StringContent("true", Encoding.UTF8), "do_table_structure");
        form.Add(new StringContent("placeholder", Encoding.UTF8), "image_export_mode");
        var pdf = new ByteArrayContent(bytes);
        pdf.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
        form.Add(pdf, "files", string.IsNullOrWhiteSpace(fileName) ? "document.pdf" : fileName);
        using var request = new HttpRequestMessage(HttpMethod.Post, Endpoint("v1/convert/file")) { Content = form };
        using var response = await SendAsync(request, cancellationToken).ConfigureAwait(false);
        if (!response.IsSuccessStatusCode) throw CreateResponseException(response, "could not convert the PDF");
        var body = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        try { return JsonDocument.Parse(body); }
        catch (JsonException ex) { throw new OckerException("Docling Serve returned invalid JSON: " + ex.Message); }
    }

    private async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        using var timeout = new CancellationTokenSource(Options.Timeout);
        using var linked = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeout.Token);
        // ResponseContentRead keeps the linked timeout active while the complete JSON body is buffered.
        try { return await _httpClient.SendAsync(request, HttpCompletionOption.ResponseContentRead, linked.Token).ConfigureAwait(false); }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (OperationCanceledException) when (timeout.IsCancellationRequested) { throw new OckerException($"Docling Serve at {Options.BaseUrl} timed out after {Options.Timeout.TotalSeconds:0} seconds."); }
        catch (HttpRequestException) { throw new OckerException($"Docling Serve is unavailable at {Options.BaseUrl}. Start the server and check the endpoint."); }
    }

    private OckerException CreateResponseException(HttpResponseMessage response, string action)
    {
        var detail = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();
        if (detail.Length > 300) detail = detail[..300] + "…";
        return new OckerException($"Docling Serve at {Options.BaseUrl} {action} ({(int)response.StatusCode} {response.ReasonPhrase})." + (string.IsNullOrWhiteSpace(detail) ? "" : " " + detail));
    }

    private Uri Endpoint(string route) => new(Options.BaseUrl.AbsoluteUri.TrimEnd('/') + "/" + route);
    public void Dispose() { if (_ownsHttpClient) _httpClient.Dispose(); }
}
