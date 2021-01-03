using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.IO;
using Microsoft.AspNetCore.Http;
using System.Drawing;
using JackBreacher.Models;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace JackBreacher.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OcrController : ControllerBase
    {
        // POST api/<OcrController>
        [HttpPost]
        public ActionResult<OcrResult> Post([FromForm] IFormFile image)
        {
            var stream = new MemoryStream();
            image.CopyTo(stream);
            stream.Position = 0;
            Image i = Image.FromStream(stream);
            return Ok(OcrHandler.PopulateMatrixFromImage(i));

            /*
            using (FileStream fs = System.IO.File.OpenWrite("result.png"))
            {
                await image.CopyToAsync(fs);
            }
            */
        }

    }
}
