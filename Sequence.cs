using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace JackBreacher
{
    public class Sequence
    {
        public List<Cell> Cells { get; set; } = new List<Cell>();
        public int Value { get; set; } = 0;
        public bool Solved { get; set; } = false;
        public int Used { get; set; } = 0;
        public bool Started { get; set; } = true;
        public List<int> SolvedValues { get; set; } = new List<int>();

        public override string ToString()
        {
            return Value.ToString() + " " + String.Join(" ", Cells.Select(c => c.ToString()));
        }

        public Sequence()
        {

        }

        public Sequence(Sequence other) 
        { 
            foreach (Cell c in other.Cells)
            {
                Cells.Add(new Cell(c));
            }
        }


        public void Reset()
        {
            Cells.ForEach(c => c.Reset());
            Solved = false;
            Used = 0;
            Started = true;
            SolvedValues.Clear();
        }

    }
}
