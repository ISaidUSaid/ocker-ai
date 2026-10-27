// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Jenko <adam@isaidusaid.com>
using System.Net.Http.Json;
using System.Text.Json;
namespace Ocker;

public enum OckerProgressStage { Reading, Extracting, Relating, Completed, Error }
public sealed record OckerProgress(OckerProgressStage Stage, string Message, double? Fraction = null);
public sealed class OckerOptions
{
    public Action<OckerProgress>? OnProgress { get; init; }
    public Action<Exception>? OnError { get; init; }
    public IOckerCompletionAdapter? CompletionAdapter { get; init; }
    /// <summary>Optional Docling Serve client used when importing PDFs.</summary>
    public DoclingServeClient? DoclingServe { get; init; }
    public string? AuthorId { get; init; }
}
public sealed record CompletionRequest(string Task, string Prompt, string Input);
public interface IOckerCompletionAdapter { Task<string> CompleteAsync(CompletionRequest request, CancellationToken cancellationToken); }

/// <summary>Optional adapter for OpenAI-compatible completion endpoints. The key remains only in this object in memory.</summary>
public sealed class OpenAiCompatibleAdapter(HttpClient client, Uri endpoint, string model, string apiKey) : IOckerCompletionAdapter
{
    public async Task<string> CompleteAsync(CompletionRequest request, CancellationToken cancellationToken)
    {
        using var message = new HttpRequestMessage(HttpMethod.Post, endpoint);
        if (!string.IsNullOrWhiteSpace(apiKey)) message.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
        message.Content = JsonContent.Create(new { model, messages = new[] { new { role = "system", content = request.Prompt }, new { role = "user", content = request.Input } }, temperature = 0 });
        using var response = await client.SendAsync(message, cancellationToken).ConfigureAwait(false);
        response.EnsureSuccessStatusCode();
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false));
        return json.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString() ?? throw new OckerException("Completion response contained no content.");
    }
}
