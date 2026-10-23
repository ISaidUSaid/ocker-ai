// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2026 Jenko <adam@isaidusaid.com>
using Avalonia.Media.Imaging;
using Avalonia.Platform;
using Avalonia;
using PdfSharp.Drawing;
using PdfSharp.Pdf;

namespace Ocker.Avalonia;

/// <summary>Exports the fully rendered chronology view without provider calls or hidden data.</summary>
public static class ChronologyExport
{
    public static Task SavePngAsync(ChronologyView view, Stream output)
    {
        var surface = view.ExportSurface; var size = view.GetExportExtent(); if (size.Width <= 0 || size.Height <= 0) throw new InvalidOperationException("Chronology board must be measured before export.");
        surface.Arrange(new Rect(size)); var bitmap = new RenderTargetBitmap(new PixelSize((int)Math.Ceiling(size.Width), (int)Math.Ceiling(size.Height)), new Vector(96, 96)); bitmap.Render(surface); bitmap.Save(output); return Task.CompletedTask;
    }
    public static async Task SavePdfAsync(ChronologyView view, Stream output)
    {
        await using var png = new MemoryStream(); await SavePngAsync(view, png); png.Position = 0;
        var extent = view.GetExportExtent(); var width = XUnitPt.FromPoint(extent.Width * 72 / 96); var height = XUnitPt.FromPoint((extent.Height + 28) * 72 / 96);
        var document = new PdfDocument(); var page = document.AddPage(); page.Width = width; page.Height = height;
        using var image = XImage.FromStream(new MemoryStream(png.ToArray(),0,(int)png.Length,false,true)); using var graphics = XGraphics.FromPdfPage(page); graphics.DrawImage(image, new XRect(XUnitPt.Zero, XUnitPt.FromPoint(28), width, XUnitPt.FromPoint(extent.Height * 72 / 96))); document.Save(output, false);
    }
}
