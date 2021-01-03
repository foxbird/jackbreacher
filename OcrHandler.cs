using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Drawing;
using System.Drawing.Imaging;
using Tesseract;
using System.IO;
using JackBreacher.Models;
using System.Text.RegularExpressions;

namespace JackBreacher
{
    public class OcrHandler
    {

        private static readonly string ALLOWED_CHARACTERS = "abcdefABCDEF1579 \n";

        public static OcrResult PopulateMatrixFromImage(Image image)
        {
            Pix pix = LoadBitmapToPix(image as Bitmap);
            List<string> Cells = GetCellsFromPix(pix);
            var root = (int)Math.Floor(Math.Sqrt(Cells.Count));
            var result = new OcrResult(root);
            for (int cell = 0, row = 0; cell < Cells.Count; cell++)
            {
                if (cell % root == 0 && cell != 0)
                    row++;

                if (row == root)
                    break;

                result.SetCell(row, (int)Math.Floor((decimal)cell % root), Cells[cell]);
            }
            image.Dispose();
            pix.Dispose();

            return result;
        }

        private static List<string> GetCellsFromPix(Pix pix)
        {
            using (var tess = new TesseractEngine(@"./tessdata", "eng", EngineMode.TesseractAndLstm))
            {
                tess.DefaultPageSegMode = PageSegMode.SingleBlock;
                //tess.DefaultPageSegMode = PageSegMode.SparseTextOsd;
                //tess.SetVariable("tessedit_char_whitelist", " ABCDEF0123456789");
                using (var result = tess.Process(pix))
                {
                    var text = result.GetText();
                    text = Regex.Replace(text, $"[^{ALLOWED_CHARACTERS}]", "_");

                    text = text.Replace("\n\n", "\n");
                    text = text.Replace(" ", "\n");
                    var cells = text.Split('\n');

                    var root = Math.Floor(Math.Sqrt(cells.Count()));
                    int count = 0;
                    List<string> output = new List<string>();
                    foreach (var cell in cells)
                    {
                        count++;
                        var cellText = cell.Trim();

                        // Fix up bad OCR
                        cellText = cellText.ToUpper();
                        /*
                        cellText = cellText.Replace("O", "D");
                        cellText = cellText.Replace("0", "D");
                        cellText = cellText.Replace("G", "9");
                        cellText = cellText.Replace("¢", "C");
                        cellText = cellText.Replace("Q", "9");
                        cellText = cellText.Replace("S", "9");
                        cellText = cellText.Replace("£", "E");

                        // Change some cells
                        if (cellText == "99")
                            cellText = "55";
                        */

                        // Match on the second character, more precisely
                        if (cellText.Length >= 2)
                        {
                            switch (cellText[1])
                            {
                                case 'D':
                                    cellText = "BD";
                                    break;
                                case 'C':
                                    cellText = "1C";
                                    break;
                                case '9':
                                    cellText = "E9";
                                    break;
                                case '5':
                                    cellText = "55";
                                    break;
                                case 'A':
                                    cellText = "7A";
                                    break;
                                case 'F':
                                    cellText = "FF";
                                    break;
                                default:
                                    break;
                            }
                        }


                        // Match on first or second
                        if (cellText.Length >= 1)
                        {
                            switch (cellText[0])
                            {
                                case 'B':
                                case 'D':
                                    cellText = "BD";
                                    break;
                                case '1':
                                case 'C':
                                    cellText = "1C";
                                    break;
                                case 'E':
                                case '9':
                                    cellText = "E9";
                                    break;
                                case '5':
                                    cellText = "55";
                                    break;
                                case '7':
                                case 'A':
                                    cellText = "7A";
                                    break;
                                case 'F':
                                    cellText = "FF";
                                    break;
                                default:
                                    break;
                            }
                        }

                        output.Add(cellText);

                        if (count == root)
                        {
                            count = 0;
                        }
                    }

                    return output;
                }
            }
        }

        private static unsafe Pix LoadBitmapToPix(Bitmap inBitmap)
        {
            Pix pix = null;
            string uniqId = Guid.NewGuid().ToString("D");

            // Clone the bitmap from whatever format it's in now to a 24bit bitmap
            using (var bitmap = inBitmap.Clone(new Rectangle(0, 0, inBitmap.Width, inBitmap.Height), PixelFormat.Format24bppRgb))
            {
                using (MemoryStream stream = new MemoryStream())
                {
                    bitmap.Save(stream, System.Drawing.Imaging.ImageFormat.Png);
                    stream.Position = 0;

                    // Write out the result for later processing
                    using (FileStream file = File.OpenWrite($"ProcessedImages/{uniqId}_Original.png"))
                    {
                        stream.CopyTo(file);
                        stream.Position = 0;
                    }
                }

                BitmapData bmpData = bitmap.LockBits(new Rectangle(0, 0, bitmap.Width, bitmap.Height), ImageLockMode.ReadWrite, bitmap.PixelFormat);
                byte bpp = 24;
                byte* scan0 = (byte*)bmpData.Scan0.ToPointer();

                int[] scales = new int[255];
                for (int i = 0; i < 255; i++)
                    scales[i] = 0;

                for (int row = 0; row < bmpData.Height; row++)
                {
                    for (int col = 0; col < bmpData.Width; col++)
                    {
                        byte* data = scan0 + row * bmpData.Stride + col * bpp / 8;
                        byte blue = data[0];
                        byte green = data[1];
                        byte red = data[2];

                        // Calculate grayscale and invert
                        byte avg = (byte)(0.2989 * red + 0.5870 * green + 0.1140 * blue);
                        blue = green = red = (byte)(255 - avg);

                        // Generate a curve for finding the best spot to threshold
                        scales[avg]++;

                        data[0] = blue;
                        data[1] = green;
                        data[2] = red;
                    }
                }

                int max = 0;
                byte maxColor = 0;
                for (byte i = 0; i < 255; i++)
                {
                    if (scales[i] > max)
                    {
                        max = scales[i];
                        maxColor = i;
                    }
                }

                // Take 100 off the color, and use that
                byte threshold = (byte)(255 - maxColor - 130);

                // Apply the threshold to all the bits
                for (int row = 0; row < bmpData.Height; row++)
                {
                    for (int col = 0; col < bmpData.Width; col++)
                    {
                        byte* data = scan0 + row * bmpData.Stride + col * bpp / 8;
                        byte blue = data[0];
                        byte green = data[1];
                        byte red = data[2];

                        // Calculate grayscale and invert
                        byte pixel = (byte)(red > threshold ? 255 : 0);
                        blue = green = red = pixel;

                        data[0] = blue;
                        data[1] = green;
                        data[2] = red;
                    }
                }

                bitmap.UnlockBits(bmpData);

                // Put the bitmap into a memory stream for Pix to load
                using (MemoryStream stream = new MemoryStream())
                {
                    bitmap.Save(stream, System.Drawing.Imaging.ImageFormat.Png);
                    stream.Position = 0;

                    // Write out the result for later processing
                    using (FileStream file = File.OpenWrite($"ProcessedImages/{uniqId}_Threshold.png"))
                    {
                        stream.CopyTo(file);
                        stream.Position = 0;
                    }

                    pix = Pix.LoadFromMemory(stream.ToArray());

                }
            }

            return pix;
        }

    }
}
