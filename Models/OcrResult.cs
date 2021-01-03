using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace JackBreacher.Models
{
    public class OcrResult
    {
        public List<List<Cell>> Cells { get; set; } = new List<List<Cell>>();

        public OcrResult() { }

        public OcrResult(int size)
        {
            for (int row = 0; row < size; row++)
            {
                Cells.Add(new List<Cell>());
                for (int col = 0; col < size; col++)
                {
                    Cells[row].Add(new Cell() { Row = row, Column = col });
                }
            }
        }

        public void SetCell(int row, int col, string value)
        {
            Cells[row][col].Value = value;
        }
    }
}
